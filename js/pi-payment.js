window.piPayment = {
  async createPayment(amount, memo, metadata = {}) {
    try {
      const paymentData = {
        amount: amount,
        memo: memo,
        metadata: metadata
      };

      const callbacks = {
        onReadyForServerApproval: (paymentId) => {
          return window.piService.apiPost('/payment/approve', { paymentId });
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          return window.piService.apiPost('/payment/complete', { paymentId, txid });
        },
        onCancel: (paymentId) => {
          console.log('Payment cancelled', paymentId);
          window.piService.apiPost('/payment/cancel', { paymentId }).catch(() => {});
        },
        onError: (error, payment) => {
          console.error('Payment error', error, payment);
        }
      };

      return await window.Pi.createPayment(paymentData, callbacks);
    } catch (error) {
      console.error('Create Payment Error:', error);
      throw error;
    }
  }
};
