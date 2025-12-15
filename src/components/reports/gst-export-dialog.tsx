'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, FileSpreadsheet, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import * as XLSX from 'xlsx';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { getGstReportData } from '@/actions/report-actions';
import { useToast } from '@/hooks/use-toast';

interface GstExportDialogProps {
    shopId: string;
    trigger?: React.ReactNode;
}

export function GstExportDialog({ shopId, trigger }: GstExportDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [isExporting, setIsExporting] = React.useState(false);
    const { toast } = useToast();

    const handleExport = async () => {
        if (!dateRange?.from) {
            toast({
                title: "Date range required",
                description: "Please select a date range for the GST report.",
                variant: "destructive"
            });
            return;
        }

        setIsExporting(true);
        try {
            const { invoices, hsnSummary } = await getGstReportData(shopId, {
                from: dateRange.from,
                to: dateRange.to
            });

            if (!invoices || invoices.length === 0) {
                toast({
                    title: "No data found",
                    description: "No paid invoices found for the selected period.",
                    variant: "destructive"
                });
                return;
            }

            // 1. Prepare B2B Data (Customers with GSTIN)
            const b2bData = invoices
                .filter((inv: any) => inv.customer?.gst_number)
                .map((inv: any) => ({
                    'GSTIN/UIN of Recipient': inv.customer.gst_number,
                    'Receiver Name': inv.customer.name,
                    'Invoice Number': inv.invoice_number,
                    'Invoice Date': format(new Date(inv.invoice_date), 'dd-MMM-yyyy'),
                    'Invoice Value': inv.grand_total,
                    'Place Of Supply': inv.customer.state || '',
                    'Reverse Charge': 'N',
                    'Invoice Type': 'Regular',
                    'E-Commerce GSTIN': '',
                    'Rate': '3.0', // Simplified, ideally per item
                    'Taxable Value': inv.subtotal,
                    'Cess Amount': '0'
                }));

            // 2. Prepare B2C Data (Customers without GSTIN)
            const b2cData = invoices
                .filter((inv: any) => !inv.customer?.gst_number)
                .map((inv: any) => ({
                    'Type': 'OE', // Other Exports / B2C
                    'Place Of Supply': inv.customer?.state || '',
                    'Invoice Number': inv.invoice_number,
                    'Invoice Date': format(new Date(inv.invoice_date), 'dd-MMM-yyyy'),
                    'Invoice Value': inv.grand_total,
                    'Rate': '3.0',
                    'Taxable Value': inv.subtotal,
                    'Cess Amount': '0',
                    'E-Commerce GSTIN': ''
                }));

            // 3. Prepare HSN Data
            const hsnData = hsnSummary.map((hsn: any) => ({
                'HSN/SAC': hsn.hsn_code,
                'Description': hsn.description,
                'UQC': hsn.uqc,
                'Total Quantity': hsn.total_quantity.toFixed(3),
                'Total Value': hsn.total_value.toFixed(2),
                'Taxable Value': hsn.taxable_value.toFixed(2),
                'Integrated Tax Amount': hsn.integrated_tax_amount.toFixed(2),
                'Central Tax Amount': hsn.central_tax_amount.toFixed(2),
                'State/UT Tax Amount': hsn.state_tax_amount.toFixed(2),
                'Cess Amount': hsn.cess_amount.toFixed(2)
            }));

            // Create Workbook
            const workbook = XLSX.utils.book_new();

            // Add Sheets
            if (b2bData.length > 0) {
                const wsB2B = XLSX.utils.json_to_sheet(b2bData);
                XLSX.utils.book_append_sheet(workbook, wsB2B, 'B2B');
            }

            if (b2cData.length > 0) {
                const wsB2C = XLSX.utils.json_to_sheet(b2cData);
                XLSX.utils.book_append_sheet(workbook, wsB2C, 'B2CS');
            }

            if (hsnData.length > 0) {
                const wsHSN = XLSX.utils.json_to_sheet(hsnData);
                XLSX.utils.book_append_sheet(workbook, wsHSN, 'HSN');
            }

            // Add Raw Data Sheet for reference
            const rawData = invoices.map((inv: any) => ({
                'Invoice No': inv.invoice_number,
                'Date': format(new Date(inv.invoice_date), 'dd-MMM-yyyy'),
                'Customer': inv.customer?.name,
                'GSTIN': inv.customer?.gst_number || 'N/A',
                'Subtotal': inv.subtotal,
                'CGST': inv.cgst_amount,
                'SGST': inv.sgst_amount,
                'Total': inv.grand_total,
                'Status': inv.status
            }));
            const wsRaw = XLSX.utils.json_to_sheet(rawData);
            XLSX.utils.book_append_sheet(workbook, wsRaw, 'All Invoices');

            // Save File
            const filename = `GSTR_Report_${format(dateRange.from, 'ddMMMyy')}${dateRange.to ? '_' + format(dateRange.to, 'ddMMMyy') : ''}.xlsx`;
            XLSX.writeFile(workbook, filename);

            toast({
                title: "Report Generated",
                description: `Successfully downloaded ${filename}`,
            });
            setOpen(false);

        } catch (error: any) {
            console.error('GST Export failed', error);
            toast({
                title: "Export Failed",
                description: error.message || "Could not generate report",
                variant: "destructive"
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        GST Report
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generate GST Report</DialogTitle>
                    <DialogDescription>
                        Select a date range to generate GSTR-1 compatible Excel sheets (B2B, B2CS, HSN).
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Report Period</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !dateRange && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, 'LLL dd, y')} -{' '}
                                                {format(dateRange.to, 'LLL dd, y')}
                                            </>
                                        ) : (
                                            format(dateRange.from, 'LLL dd, y')
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Download Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
