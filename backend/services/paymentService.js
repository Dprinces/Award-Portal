const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Vote = require('../models/Vote');
const User = require('../models/User');
const Nominee = require('../models/Nominee');
const Category = require('../models/Category');

class PaymentService {
  constructor() {
    this.opayMerchantId = process.env.OPAY_MERCHANT_ID;
    this.opayPrivateKey = process.env.OPAY_PRIVATE_KEY;
    this.opayPublicKey = process.env.OPAY_PUBLIC_KEY;
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api.opaycheckout.com/api/v1/international'
      : 'https://sandboxapi.opaycheckout.com/api/v1/international';
    this.webhookSecret = process.env.OPAY_WEBHOOK_SECRET;
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment({
    userId,
    nomineeId,
    categoryId,
    amount,
    email,
    metadata = {}
  }) {
    try {
      // Validate inputs
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const nominee = await Nominee.findById(nomineeId).populate('category');
      if (!nominee) {
        throw new Error('Nominee not found');
      }

      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Check if voting is active for this category
      if (!category.isVotingActive) {
        throw new Error('Voting is not active for this category');
      }

      // Check if user has reached maximum votes for this category
      const userVotesCount = await Vote.countDocuments({
        voter: userId,
        category: categoryId,
        status: 'verified'
      });

      if (userVotesCount >= category.votingSettings.maxVotesPerUser) {
        throw new Error(`You have reached the maximum number of votes (${category.votingSettings.maxVotesPerUser}) for this category`);
      }

      // Generate internal reference
      const internalReference = Payment.generateInternalReference();

      // Prepare payment data for OPay
      const paymentData = {
        country: "NG",
        reference: internalReference,
        amount: {
          currency: "NGN",
          total: amount * 100 // Convert to kobo
        },
        callbackUrl: `${process.env.BACKEND_URL}/api/payments/opay/callback`,
        returnUrl: `${process.env.FRONTEND_URL}/payment/callback`,
        product: {
          name: "Vote Payment",
          description: `Vote for nominee in category`
        },
        userInfo: {
          userName: user.name || user.email,
          userEmail: email || user.email,
          userMobile: user.phone || ""
        },
        payMethod: "BankCard"
      };

      // Generate HMAC signature for OPay
      const signature = this.generateSignature(paymentData);

      // Make request to OPay
      const response = await axios.post(
        `${this.baseURL}/payment/create`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${signature}`,
            'MerchantId': this.opayMerchantId,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code !== '00000') {
        throw new Error(response.data.message || 'Payment initialization failed');
      }

      // Create payment record
      const payment = new Payment({
        user: userId,
        amount: amount,
        currency: 'NGN',
        status: 'pending',
        gateway: 'opay',
        internalReference,
        gatewayReference: response.data.data.orderNo,
        authorizationUrl: response.data.data.cashierUrl,
        accessCode: response.data.data.orderNo,
        metadata: {
          purpose: 'vote_payment',
          category: categoryId,
          nominee: nomineeId,
          ...metadata
        }
      });

      await payment.save();

      return {
        success: true,
        data: {
          paymentId: payment._id,
          authorizationUrl: response.data.data.cashierUrl,
          accessCode: response.data.data.orderNo,
          reference: internalReference
        }
      };

    } catch (error) {
      console.error('Payment initialization error:', error);
      throw new Error(error.message || 'Failed to initialize payment');
    }
  }

  /**
   * Generate HMAC signature for OPay API
   */
  generateSignature(data) {
    const dataString = JSON.stringify(data);
    return crypto.createHmac('sha512', this.opayPrivateKey).update(dataString).digest('hex');
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(reference) {
    try {
      // Find payment record
      const payment = await Payment.findOne({
        $or: [
          { internalReference: reference },
          { gatewayReference: reference }
        ]
      }).populate('user');

      if (!payment) {
        throw new Error('Payment record not found');
      }

      // If already verified, return existing data
      if (payment.status === 'successful') {
        return {
          success: true,
          data: {
            payment,
            alreadyVerified: true
          }
        };
      }

      // Verify with OPay
      const queryData = {
        orderNo: payment.gatewayReference,
        reference: payment.gatewayReference
      };

      const signature = this.generateSignature(queryData);

      const response = await axios.post(
        `${this.baseURL}/payment/status`,
        queryData,
        {
          headers: {
            'Authorization': `Bearer ${signature}`,
            'MerchantId': this.opayMerchantId,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code !== '00000') {
        throw new Error(response.data.message || 'Payment verification failed');
      }

      const transactionData = response.data.data;

      // Update payment record
      payment.status = transactionData.status === 'SUCCESS' ? 'successful' : 'failed';
      payment.gatewayResponse = transactionData;
      payment.paidAt = transactionData.paid_at ? new Date(transactionData.paid_at) : new Date();
      payment.fees = {
        gateway: transactionData.fees || 0,
        total: transactionData.fees || 0
      };
      payment.netAmount = payment.amount - (payment.fees.total / 100);
      payment.channel = transactionData.channel;
      payment.ipAddress = transactionData.ip_address;

      if (transactionData.authorization) {
        payment.authorization = {
          authorizationCode: transactionData.authorization.authorization_code,
          bin: transactionData.authorization.bin,
          last4: transactionData.authorization.last4,
          expMonth: transactionData.authorization.exp_month,
          expYear: transactionData.authorization.exp_year,
          cardType: transactionData.authorization.card_type,
          bank: transactionData.authorization.bank,
          countryCode: transactionData.authorization.country_code,
          brand: transactionData.authorization.brand,
          reusable: transactionData.authorization.reusable
        };
      }

      await payment.save();

      // If payment successful, create vote record
      if (payment.status === 'successful') {
        await this.createVoteFromPayment(payment);
      }

      return {
        success: true,
        data: {
          payment,
          transaction: transactionData
        }
      };

    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error(error.message || 'Failed to verify payment');
    }
  }

  /**
   * Handle OPay callback notification
   */
  async handleOPayCallback(payload, signature) {
    try {
      // Verify the callback signature
      const expectedSignature = this.generateSignature(payload);
      const receivedSignature = signature.replace('Bearer ', '');
      
      if (expectedSignature !== receivedSignature) {
        throw new Error('Invalid callback signature');
      }

      const { reference, orderNo, status } = payload;
      
      // Find payment by reference or orderNo
      const payment = await Payment.findOne({
        $or: [
          { reference: reference },
          { gatewayReference: orderNo }
        ]
      });

      if (!payment) {
        console.log('Payment not found for callback:', { reference, orderNo });
        return;
      }

      // Update payment status based on OPay status
      if (status === 'SUCCESS' && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.gatewayResponse = payload;
        payment.verifiedAt = new Date();
        await payment.save();

        // Create vote from payment
        await this.createVoteFromPayment(payment);
        
        console.log('Payment completed via callback:', payment.reference);
      } else if (status === 'FAILED') {
        payment.status = 'failed';
        payment.gatewayResponse = payload;
        await payment.save();
        
        console.log('Payment failed via callback:', payment.reference);
      }

    } catch (error) {
      console.error('OPay callback handling error:', error);
      throw error;
    }
  }

  /**
   * Create vote record from successful payment
   */
  async createVoteFromPayment(payment) {
    try {
      const { category, nominee } = payment.metadata;

      // Check if vote already exists for this payment
      const existingVote = await Vote.findOne({ paymentReference: payment.internalReference });
      if (existingVote) {
        return existingVote;
      }

      // Create vote record
      const vote = new Vote({
        voter: payment.user,
        nominee: nominee,
        category: category,
        paymentReference: payment.internalReference,
        amount: payment.amount,
        currency: payment.currency,
        status: 'verified',
        paymentMethod: payment.channel,
        transactionId: payment.gatewayReference,
        ipAddress: payment.ipAddress,
        netAmount: payment.netAmount,
        metadata: {
          paymentId: payment._id,
          gatewayFees: payment.fees.gateway
        }
      });

      await vote.save();

      // Update nominee statistics
      await this.updateNomineeStats(nominee);

      return vote;

    } catch (error) {
      console.error('Error creating vote from payment:', error);
      throw error;
    }
  }

  /**
   * Update nominee statistics after vote
   */
  async updateNomineeStats(nomineeId) {
    try {
      const stats = await Vote.aggregate([
        {
          $match: {
            nominee: nomineeId,
            status: 'verified'
          }
        },
        {
          $group: {
            _id: null,
            totalVotes: { $sum: 1 },
            totalRevenue: { $sum: '$amount' },
            uniqueVoters: { $addToSet: '$voter' },
            averageVoteValue: { $avg: '$amount' }
          }
        }
      ]);

      if (stats.length > 0) {
        const stat = stats[0];
        await Nominee.findByIdAndUpdate(nomineeId, {
          'statistics.totalVotes': stat.totalVotes,
          'statistics.totalRevenue': stat.totalRevenue,
          'statistics.uniqueVoters': stat.uniqueVoters.length,
          'statistics.averageVoteValue': stat.averageVoteValue
        });
      }

    } catch (error) {
      console.error('Error updating nominee stats:', error);
    }
  }

  /**
   * Handle Paystack webhook
   */
  async handleWebhook(payload, signature) {
    try {
      // Verify webhook signature
      const hash = crypto
        .createHmac('sha512', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (hash !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const { event, data } = payload;

      switch (event) {
        case 'charge.success':
          await this.handleChargeSuccess(data);
          break;
        case 'charge.failed':
          await this.handleChargeFailed(data);
          break;
        case 'transfer.success':
          await this.handleTransferSuccess(data);
          break;
        case 'transfer.failed':
          await this.handleTransferFailed(data);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Handle successful charge webhook
   */
  async handleChargeSuccess(data) {
    try {
      const payment = await Payment.findOne({
        gatewayReference: data.reference
      });

      if (payment && payment.status !== 'successful') {
        payment.status = 'successful';
        payment.webhookData = data;
        payment.paidAt = new Date(data.paid_at);
        await payment.save();

        // Create vote if not already created
        if (payment.metadata.purpose === 'vote_payment') {
          await this.createVoteFromPayment(payment);
        }
      }

    } catch (error) {
      console.error('Error handling charge success webhook:', error);
    }
  }

  /**
   * Handle failed charge webhook
   */
  async handleChargeFailed(data) {
    try {
      const payment = await Payment.findOne({
        gatewayReference: data.reference
      });

      if (payment) {
        payment.status = 'failed';
        payment.webhookData = data;
        payment.failureReason = data.gateway_response || 'Payment failed';
        await payment.save();
      }

    } catch (error) {
      console.error('Error handling charge failed webhook:', error);
    }
  }

  /**
   * Handle transfer success webhook
   */
  async handleTransferSuccess(data) {
    // Handle transfer success if needed for refunds
    console.log('Transfer success:', data);
  }

  /**
   * Handle transfer failed webhook
   */
  async handleTransferFailed(data) {
    // Handle transfer failure if needed for refunds
    console.log('Transfer failed:', data);
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(filters = {}) {
    try {
      const matchStage = { status: 'successful' };
      
      if (filters.startDate && filters.endDate) {
        matchStage.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      if (filters.category) {
        matchStage['metadata.category'] = filters.category;
      }

      const stats = await Payment.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalRevenue: { $sum: '$amount' },
            totalFees: { $sum: '$fees.total' },
            netRevenue: { $sum: '$netAmount' },
            averagePayment: { $avg: '$amount' }
          }
        }
      ]);

      return stats.length > 0 ? stats[0] : {
        totalPayments: 0,
        totalRevenue: 0,
        totalFees: 0,
        netRevenue: 0,
        averagePayment: 0
      };

    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId, reason = 'Refund requested') {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'successful') {
        throw new Error('Cannot refund unsuccessful payment');
      }

      // Create refund with Paystack
      const refundData = {
        transaction: payment.gatewayReference,
        amount: payment.amount * 100, // Convert to kobo
        currency: payment.currency,
        customer_note: reason,
        merchant_note: `Refund for vote payment - ${reason}`
      };

      const response = await axios.post(
        `${this.baseURL}/refund`,
        refundData,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Refund failed');
      }

      // Update payment record
      payment.refund = {
        status: 'pending',
        amount: payment.amount,
        reason: reason,
        refundReference: response.data.data.transaction.reference,
        requestedAt: new Date()
      };

      await payment.save();

      // Mark associated vote as refunded
      await Vote.findOneAndUpdate(
        { paymentReference: payment.internalReference },
        { 
          status: 'refunded',
          refundReason: reason,
          refundedAt: new Date()
        }
      );

      return {
        success: true,
        data: {
          refundReference: response.data.data.transaction.reference,
          status: 'pending'
        }
      };

    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();