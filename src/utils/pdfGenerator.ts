export const generateComplaintReceipt = (complaint: any) => {
  const doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .receipt-id { font-size: 14px; color: #666; margin-top: 10px; }
    .section { margin-bottom: 20px; }
    .label { font-weight: bold; color: #333; }
    .value { margin-left: 10px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-urgent { background: #FEE2E2; color: #991B1B; }
    .badge-high { background: #FED7AA; color: #9A3412; }
    .badge-medium { background: #FEF3C7; color: #92400E; }
    .badge-low { background: #D1FAE5; color: #065F46; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Complaint Receipt</h1>
    <p class="receipt-id">Receipt ID: ${complaint.id}</p>
    <p class="receipt-id">Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="section">
    <span class="label">Title:</span>
    <span class="value">${complaint.title}</span>
  </div>
  
  <div class="section">
    <span class="label">Description:</span>
    <div class="value">${complaint.description}</div>
  </div>
  
  <div class="section">
    <span class="label">Category:</span>
    <span class="value">${complaint.category}</span>
  </div>
  
  <div class="section">
    <span class="label">Priority:</span>
    <span class="badge badge-${complaint.urgency}">${complaint.urgency.toUpperCase()}</span>
  </div>
  
  <div class="section">
    <span class="label">Status:</span>
    <span class="value">${complaint.status}</span>
  </div>
  
  <div class="section">
    <span class="label">Submitted:</span>
    <span class="value">${new Date(complaint.created_at).toLocaleString()}</span>
  </div>
  
  ${complaint.deadline ? `
  <div class="section">
    <span class="label">Expected Resolution:</span>
    <span class="value">${new Date(complaint.deadline).toLocaleString()}</span>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>This is an automatically generated receipt for your complaint submission.</p>
    <p>Please keep this for your records.</p>
  </div>
</body>
</html>
  `;

  // Create blob and download
  const blob = new Blob([doc], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `complaint-receipt-${complaint.id.slice(0, 8)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
