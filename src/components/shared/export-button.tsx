import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';

interface ExportButtonProps {
    data?: any[];
    fetchData?: () => Promise<any[]>;
    filename?: string;
    label?: string;
    className?: string;
}

export function ExportButton({ data, fetchData, filename = 'export', label = 'Export', className }: ExportButtonProps) {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleExport = async () => {
        try {
            setIsLoading(true);
            let exportData = data;

            if (fetchData) {
                exportData = await fetchData();
            }

            if (!exportData || exportData.length === 0) {
                console.warn("No data to export");
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            XLSX.writeFile(workbook, `${filename}.xlsx`);
        } catch (error) {
            console.error("Export failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className={className}
            onClick={handleExport}
            disabled={isLoading || (!fetchData && (!data || data.length === 0))}
        >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {label}
        </Button>
    );
}
