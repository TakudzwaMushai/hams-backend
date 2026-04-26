jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  })
}));

const nodemailer  = require('nodemailer');
const sendEmail   = require('../../../src/utils/sendEmail');

process.env.EMAIL_USER = 'test@gmail.com';
process.env.EMAIL_PASS = 'testpass';

describe('sendEmail Utility', () => {
  it('should call sendMail with correct parameters', async () => {
    await sendEmail({
      to:      'recipient@example.com',
      subject: 'Test Subject',
      html:    '<p>Test</p>'
    });

    const transporterInstance = nodemailer.createTransport();
    expect(transporterInstance.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to:      'recipient@example.com',
        subject: 'Test Subject',
        html:    '<p>Test</p>'
      })
    );
  });

  it('should throw if sendMail fails', async () => {
    const transporterInstance = nodemailer.createTransport();
    transporterInstance.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

    await expect(sendEmail({
      to:      'recipient@example.com',
      subject: 'Test',
      html:    '<p>Test</p>'
    })).rejects.toThrow('SMTP error');
  });
});