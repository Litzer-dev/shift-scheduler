import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { HourlyRotation } from '@/types';
import { formatTime } from './shiftRotation';
import { getDayName } from './scheduleHelpers';

// Export week rotation to PDF
export function exportToPDF(
  weekRotations: { [date: string]: HourlyRotation[] },
  weekDates: string[]
) {
  const doc = new jsPDF('portrait');
  
  // Process each day - each day gets its own page
  weekDates.forEach((date, dayIndex) => {
    const rotations = weekRotations[date] || [];
    
    if (rotations.length === 0) return;
    
    // Add new page for each day (except first day)
    if (dayIndex > 0) {
      doc.addPage('portrait');
    }
    
    // Day header
    const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayIndex] as 
      'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    const dayName = getDayName(dayKey);
    const dateStr = new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Shift Rotation Schedule', 14, 15);
    
    // Date
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(dateStr, 14, 25);
    
    // Check if any rotation has floaters
    const hasFloater = rotations.some(r => r.floater.length > 0);
    
    // Prepare table data
    const tableData = rotations.map(rotation => {
      const row = [
        formatTime(rotation.startTime),
        rotation.outside.length > 0 
          ? rotation.outside.map(p => p.teamMemberName).join(', ') 
          : '—',
        rotation.inside.length > 0 
          ? rotation.inside.map(p => p.teamMemberName).join(', ') 
          : '—',
      ];
      
      if (hasFloater) {
        row.push(
          rotation.floater.length > 0 
            ? rotation.floater.map(p => p.teamMemberName).join(', ') 
            : '—'
        );
      }
      
      return row;
    });
    
    const headers = hasFloater 
      ? ['Time', 'Outside', 'Inside', 'Floater']
      : ['Time', 'Outside', 'Inside'];
    
    // Add table
    autoTable(doc, {
      startY: 35,
      head: [headers],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 30 },
      },
      margin: { left: 14, right: 14 },
    });
  });
  
  // Save the PDF
  const fileName = `shift-rotation-${weekDates[0]}.pdf`;
  doc.save(fileName);
}

// Export week rotation to Excel
export function exportToExcel(
  weekRotations: { [date: string]: HourlyRotation[] },
  weekDates: string[]
) {
  const workbook = XLSX.utils.book_new();
  
  weekDates.forEach((date, dayIndex) => {
    const rotations = weekRotations[date] || [];
    
    if (rotations.length === 0) return;
    
    const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayIndex] as 
      'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    const dayName = getDayName(dayKey);
    
    // Check if any rotation has floaters
    const hasFloater = rotations.some(r => r.floater.length > 0);
    
    // Prepare data for this day
    const data = [
      [dayName, new Date(date).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })],
      [], // Empty row
      hasFloater 
        ? ['Time', 'Outside', 'Inside', 'Floater']
        : ['Time', 'Outside', 'Inside'],
    ];
    
    rotations.forEach(rotation => {
      const row = [
        formatTime(rotation.startTime),
        rotation.outside.length > 0 
          ? rotation.outside.map(p => p.teamMemberName).join(', ') 
          : '—',
        rotation.inside.length > 0 
          ? rotation.inside.map(p => p.teamMemberName).join(', ') 
          : '—',
      ];
      
      if (hasFloater) {
        row.push(
          rotation.floater.length > 0 
            ? rotation.floater.map(p => p.teamMemberName).join(', ') 
            : '—'
        );
      }
      
      data.push(row);
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, dayName.substring(0, 31));
  });
  
  // Save the Excel file
  const fileName = `shift-rotation-${weekDates[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

// Export single day to PDF (for quick prints)
export function exportDayToPDF(
  date: string,
  dayName: string,
  rotations: HourlyRotation[]
) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Daily Shift Rotation', 14, 15);
  
  // Add date
  doc.setFontSize(12);
  const dateStr = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  doc.text(dateStr, 14, 25);
  
  // Check if any rotation has floaters
  const hasFloater = rotations.some(r => r.floater.length > 0);
  
  // Prepare table data
  const tableData = rotations.map(rotation => {
    const row = [
      formatTime(rotation.startTime),
      rotation.outside.length > 0 
        ? rotation.outside.map(p => p.teamMemberName).join(', ') 
        : '—',
      rotation.inside.length > 0 
        ? rotation.inside.map(p => p.teamMemberName).join(', ') 
        : '—',
    ];
    
    if (hasFloater) {
      row.push(
        rotation.floater.length > 0 
          ? rotation.floater.map(p => p.teamMemberName).join(', ') 
          : '—'
      );
    }
    
    return row;
  });
  
  const headers = hasFloater 
    ? ['Time', 'Outside', 'Inside', 'Floater']
    : ['Time', 'Outside', 'Inside'];
  
  // Add table
  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [66, 139, 202], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 30 },
    },
  });
  
  // Save the PDF
  const fileName = `shift-rotation-${date}.pdf`;
  doc.save(fileName);
}
