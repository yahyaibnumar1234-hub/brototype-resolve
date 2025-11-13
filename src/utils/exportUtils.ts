interface ExportComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  student_name?: string;
  student_email?: string;
}

export const exportToCSV = (complaints: ExportComplaint[], filename: string = 'complaints.csv') => {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Category',
    'Urgency',
    'Status',
    'Student Name',
    'Student Email',
    'Created At',
    'Updated At',
    'Resolved At'
  ];

  const rows = complaints.map(c => [
    c.id,
    `"${c.title.replace(/"/g, '""')}"`,
    `"${c.description.replace(/"/g, '""')}"`,
    c.category,
    c.urgency,
    c.status,
    c.student_name || 'N/A',
    c.student_email || 'N/A',
    new Date(c.created_at).toLocaleString(),
    new Date(c.updated_at).toLocaleString(),
    c.resolved_at ? new Date(c.resolved_at).toLocaleString() : 'Not resolved'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = async (complaints: ExportComplaint[], filename: string = 'complaints.pdf') => {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
        .complaint { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
        .complaint h2 { color: #4F46E5; margin-top: 0; }
        .meta { color: #666; font-size: 14px; margin: 10px 0; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px; }
        .status-open { background-color: #3B82F6; color: white; }
        .status-in_progress { background-color: #F59E0B; color: white; }
        .status-resolved { background-color: #10B981; color: white; }
        .urgency-low { background-color: #10B981; color: white; }
        .urgency-medium { background-color: #F59E0B; color: white; }
        .urgency-high { background-color: #F97316; color: white; }
        .urgency-urgent { background-color: #EF4444; color: white; }
      </style>
    </head>
    <body>
      <h1>Complaint Report</h1>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Complaints:</strong> ${complaints.length}</p>
      <hr />
      ${complaints.map(c => `
        <div class="complaint">
          <h2>${c.title}</h2>
          <div class="meta">
            <span class="badge status-${c.status}">${c.status.replace('_', ' ').toUpperCase()}</span>
            <span class="badge urgency-${c.urgency}">${c.urgency.toUpperCase()}</span>
            <span class="badge">${c.category.toUpperCase()}</span>
          </div>
          <p><strong>Description:</strong> ${c.description}</p>
          ${c.student_name ? `<p><strong>Student:</strong> ${c.student_name} (${c.student_email})</p>` : ''}
          <p><strong>Created:</strong> ${new Date(c.created_at).toLocaleString()}</p>
          ${c.resolved_at ? `<p><strong>Resolved:</strong> ${new Date(c.resolved_at).toLocaleString()}</p>` : ''}
        </div>
      `).join('')}
    </body>
    </html>
  `;

  // Convert HTML to PDF using browser print functionality
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
