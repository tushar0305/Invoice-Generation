'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download, Loader2, Filter } from 'lucide-react';
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useMediaQuery } from '@/hooks/use-media-query';

interface FilterOption {
    label: string;
    value: string;
}

interface ExportDialogProps {
    filename?: string;
    statusOptions?: FilterOption[];
    onExport: (filters: { dateRange?: DateRange; status?: string }) => Promise<any[]>;
    trigger?: React.ReactNode;
}

export function ExportDialog({
    filename = 'export',
    statusOptions,
    onExport,
    trigger,
}: ExportDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [selectedStatus, setSelectedStatus] = React.useState<string>('all');
    const [isExporting, setIsExporting] = React.useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await onExport({
                dateRange,
                status: selectedStatus === 'all' ? undefined : selectedStatus,
            });

            if (!data || data.length === 0) {
                // Should probably show a toast here, but console warning for now
                console.warn('No data to export');
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            XLSX.writeFile(workbook, `${filename}.xlsx`);
            setOpen(false);
        } catch (error) {
            console.error('Export failed', error);
        } finally {
            setIsExporting(false);
        }
    };

    const Content = (
        <div className="grid gap-4 py-4">
            {/* Date Range Picker */}
            <div className="grid gap-2">
                <Label>Date Range</Label>
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
                                <span>Pick a date range (Optional)</span>
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
                            numberOfMonths={isDesktop ? 2 : 1}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Status Filter */}
            {statusOptions && (
                <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );

    const Footer = (
        <>
            <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
                {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Export Excel
            </Button>
        </>
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Export Data</DialogTitle>
                        <DialogDescription>
                            Choose date range and filters for your export.
                        </DialogDescription>
                    </DialogHeader>
                    {Content}
                    <DialogFooter>
                        {Footer}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom">
                <SheetHeader>
                    <SheetTitle>Export Data</SheetTitle>
                    <SheetDescription>
                        Choose date range and filters for your export.
                    </SheetDescription>
                </SheetHeader>
                {Content}
                <SheetFooter className="gap-2">
                    {Footer}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
