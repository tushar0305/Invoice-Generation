import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { UserSettings } from "@/lib/definitions";

interface LiveInvoicePreviewProps {
    data: any; // Using any for form values flexibility, strictly typed in parent
    settings: UserSettings | null;
    invoiceNumber?: string;
}

export function LiveInvoicePreview({ data, settings, invoiceNumber = "INV-PREVIEW" }: LiveInvoicePreviewProps) {
    // Calculate totals locally for preview
    const items = data.items || [];
    const subtotal = items.reduce((acc: number, item: any) => {
        const netWeight = Number(item.netWeight) || 0;
        const rate = Number(item.rate) || 0;
        const making = Number(item.making) || 0;
        return acc + (netWeight * rate) + (netWeight * making);
    }, 0);

    const discount = Number(data.discount) || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const sgstRate = Number(data.sgst) || 0;
    const cgstRate = Number(data.cgst) || 0;
    const sgstAmount = taxableAmount * (sgstRate / 100);
    const cgstAmount = taxableAmount * (cgstRate / 100);
    const grandTotal = taxableAmount + sgstAmount + cgstAmount;

    return (
        <Card className="h-full overflow-hidden bg-white text-slate-900 shadow-2xl print:shadow-none">
            <CardContent className="p-8 h-full flex flex-col text-[10px] sm:text-xs font-serif leading-relaxed overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">{settings?.shopName || "Jewellery Store"}</h1>
                        <p className="text-slate-500 max-w-[200px]">{settings?.address}</p>
                        <p className="text-slate-500">{settings?.state} {settings?.pincode}</p>
                        <p className="text-slate-500">Phone: {settings?.phoneNumber}</p>
                        {settings?.email && <p className="text-slate-500">Email: {settings?.email}</p>}
                    </div>
                    <div className="text-right space-y-1">
                        <h2 className="text-xl font-light text-slate-400">INVOICE</h2>
                        <p className="font-mono font-bold text-slate-700">{invoiceNumber}</p>
                        <p className="text-slate-500">Date: {data.invoiceDate ? format(data.invoiceDate, "dd MMM yyyy") : format(new Date(), "dd MMM yyyy")}</p>
                        <div className="mt-2 text-[10px] text-slate-400">
                            {settings?.gstNumber && <p>GSTIN: {settings.gstNumber}</p>}
                            {settings?.panNumber && <p>PAN: {settings.panNumber}</p>}
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3>
                    <div className="text-sm font-medium text-slate-900">{data.customerName || "Customer Name"}</div>
                    <div className="text-slate-600 mt-1 whitespace-pre-wrap">{data.customerAddress || "Address"}</div>
                    <div className="text-slate-600 mt-1">
                        {data.customerState} {data.customerPincode}
                    </div>
                    <div className="text-slate-600 mt-1">{data.customerPhone}</div>
                </div>

                {/* Items Table */}
                <div className="flex-grow">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-slate-900 text-[10px] uppercase tracking-wider text-slate-500">
                                <th className="pb-2 font-medium">Description</th>
                                <th className="pb-2 font-medium text-center">Purity</th>
                                <th className="pb-2 font-medium text-right">Net Wt</th>
                                <th className="pb-2 font-medium text-right">Rate</th>
                                <th className="pb-2 font-medium text-right">Making</th>
                                <th className="pb-2 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            {items.map((item: any, i: number) => {
                                const netWeight = Number(item.netWeight) || 0;
                                const rate = Number(item.rate) || 0;
                                const making = Number(item.making) || 0;
                                const total = (netWeight * rate) + (netWeight * making);
                                return (
                                    <tr key={item.id || i} className="border-b border-slate-100 last:border-0">
                                        <td className="py-3 pr-2 font-medium">{item.description || "Item"}</td>
                                        <td className="py-3 px-2 text-center">{item.purity}K</td>
                                        <td className="py-3 px-2 text-right">{netWeight.toFixed(3)} g</td>
                                        <td className="py-3 px-2 text-right">{formatCurrency(rate)}</td>
                                        <td className="py-3 px-2 text-right">{formatCurrency(making * netWeight)}</td>
                                        <td className="py-3 pl-2 text-right font-bold text-slate-900">{formatCurrency(total)}</td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-300 italic">No items added</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="mt-8 flex justify-end">
                    <div className="w-full sm:w-1/2 space-y-2">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-{formatCurrency(discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-500">
                            <span>SGST ({sgstRate}%)</span>
                            <span>{formatCurrency(sgstAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>CGST ({cgstRate}%)</span>
                            <span>{formatCurrency(cgstAmount)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-base font-bold text-slate-900">
                            <span>Grand Total</span>
                            <span>{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-100 text-center text-slate-400 text-[10px]">
                    <p>Thank you for your business!</p>
                    <p className="mt-1">Terms & Conditions Apply</p>
                </div>
            </CardContent>
        </Card>
    );
}
