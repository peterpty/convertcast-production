import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      to,
      subject,
      invoiceData,
      pdfAttachment
    } = await req.json();

    // Validate input
    if (!to || !subject || !invoiceData || !pdfAttachment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email template for invoice
    const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #8B5CF6, #3B82F6); padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; }
        .invoice-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .total { font-size: 24px; font-weight: bold; color: #8B5CF6; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 Invoice from ${invoiceData.company.name}</h1>
        <p>Thank you for your purchase!</p>
    </div>

    <div class="content">
        <p>Dear ${invoiceData.customer.name},</p>

        <p>Thank you for your purchase! Your payment has been processed successfully.</p>

        <div class="invoice-details">
            <h3>📋 Invoice Details</h3>
            <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
            <p><strong>Payment Method:</strong> ${invoiceData.paymentDetails.method}</p>
            <p><strong>Transaction ID:</strong> ${invoiceData.paymentDetails.transactionId}</p>
            <p><strong>Payment Date:</strong> ${invoiceData.paymentDetails.paymentDate}</p>
            <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">✅ PAID</span></p>
        </div>

        <div class="invoice-details">
            <h3>💰 Payment Summary</h3>
            ${invoiceData.lineItems.map(item => `
                <p>${item.description}: <strong>${invoiceData.summary.currency === 'USD' ? '$' : '€'}${item.total.toFixed(2)}</strong></p>
            `).join('')}

            ${invoiceData.summary.tax > 0 ? `<p>Tax: <strong>${invoiceData.summary.currency === 'USD' ? '$' : '€'}${invoiceData.summary.tax.toFixed(2)}</strong></p>` : ''}

            <hr style="margin: 15px 0;">
            <p class="total">Total: ${invoiceData.summary.currency === 'USD' ? '$' : '€'}${invoiceData.summary.total.toFixed(2)}</p>
        </div>

        <div class="invoice-details">
            <h3>🚀 What's Next?</h3>
            <p>Your premium training program access has been activated! You should receive a separate email with your login credentials and course access details within the next few minutes.</p>

            <ul>
                <li>✅ Full course access activated</li>
                <li>✅ Bonus materials unlocked</li>
                <li>✅ Private community access granted</li>
                <li>✅ 30-day money-back guarantee active</li>
            </ul>
        </div>

        <p>If you have any questions or need support, please don't hesitate to contact us at <a href="mailto:${invoiceData.company.email}">${invoiceData.company.email}</a></p>

        <p>Best regards,<br>
        The ${invoiceData.company.name} Team</p>
    </div>

    <div class="footer">
        <p>${invoiceData.company.name} • ${invoiceData.company.address.line1}, ${invoiceData.company.address.city}, ${invoiceData.company.address.state} ${invoiceData.company.address.postalCode}</p>
        <p>Email: ${invoiceData.company.email} • Phone: ${invoiceData.company.phone} • Website: ${invoiceData.company.website}</p>
    </div>
</body>
</html>
    `.trim();

    // In a production environment, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Postmark

    // For now, we'll simulate the email sending process
    console.log('📧 Simulating invoice email send...');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Invoice #:', invoiceData.invoiceNumber);
    console.log('Amount:', `${invoiceData.summary.currency} ${invoiceData.summary.total}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock email ID
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, you would make an actual API call like:
    /*
    const emailService = new SendGridAPI(process.env.SENDGRID_API_KEY);
    const result = await emailService.send({
      to: to,
      from: invoiceData.company.email,
      subject: subject,
      html: emailTemplate,
      attachments: [{
        filename: `Invoice-${invoiceData.invoiceNumber}.pdf`,
        content: pdfAttachment,
        type: 'application/pdf',
        disposition: 'attachment'
      }]
    });
    */

    console.log('✅ Invoice email sent successfully (simulated)');

    return NextResponse.json({
      success: true,
      emailId,
      message: 'Invoice email sent successfully'
    });

  } catch (error) {
    console.error('Send invoice email error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}