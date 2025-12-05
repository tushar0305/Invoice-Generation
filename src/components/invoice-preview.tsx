import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { UserSettings } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

interface LiveInvoicePreviewProps {
    data: any;
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
        <Card className="w-full h-full bg-white text-slate-900 shadow-2xl print:shadow-none border-0 relative mx-auto flex flex-col">
            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '20px 20px' }}>
            </div>

            <CardContent className="p-0 flex-grow flex flex-col text-xs font-serif leading-relaxed overflow-y-auto relative z-10">
                {/* Top Gold Bar */}
                <div className="h-2 w-full bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] flex-shrink-0"></div>

                <div className="p-8 flex-grow flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase font-heading">{settings?.shopName || "Jewellery Store"}</h1>
                            <div className="text-slate-500 text-[11px] uppercase tracking-widest font-medium">Premium Jewellery Collection</div>
                            <div className="pt-2 space-y-0.5 text-slate-600">
                                <p className="max-w-[250px]">{settings?.address}</p>
                                <p>{settings?.state} {settings?.pincode}</p>
                                <p>Phone: {settings?.phoneNumber}</p>
                                {settings?.email && <p>Email: {settings?.email}</p>}
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="inline-block px-4 py-1 bg-slate-900 text-[#D4AF37] text-xs font-bold tracking-widest uppercase mb-2">Tax Invoice</div>
                            <p className="font-mono font-bold text-lg text-slate-800">{invoiceNumber}</p>
                            <p className="text-slate-500">Date: {data.invoiceDate ? format(new Date(data.invoiceDate), "dd MMM yyyy") : format(new Date(), "dd MMM yyyy")}</p>
                            <div className="mt-3 text-[10px] text-slate-400 space-y-0.5">
                                {settings?.gstNumber && <p>GSTIN: <span className="font-mono text-slate-600">{settings.gstNumber}</span></p>}
                                {settings?.panNumber && <p>PAN: <span className="font-mono text-slate-600">{settings.panNumber}</span></p>}
                            </div>
                        </div>
                    </div>

                    <Separator className="mb-8 bg-slate-100" />

                    {/* Customer Info */}
                    <div className="mb-8 flex gap-8">
                        <div className="flex-1 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                            <h3 className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-3">Billed To</h3>
                            <div className="text-base font-bold text-slate-900 mb-1">{data.customerName || "Customer Name"}</div>
                            <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">{data.customerAddress || "Address"}</div>
                            <div className="text-slate-600 mt-1">
                                {data.customerState} {data.customerPincode}
                            </div>
                            <div className="text-slate-600 mt-2 font-mono text-[11px]">{data.customerPhone}</div>
                        </div>
                        <div className="w-1/3 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                            <h3 className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-3">Payment Status</h3>
                            <StatusBadge
                                status={data.status}
                                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-0"
                            />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="flex-grow mb-8">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-900 text-[10px] uppercase tracking-wider text-slate-500">
                                    <th className="py-3 font-bold pl-2">Description</th>
                                    <th className="py-3 font-bold text-center">Purity</th>
                                    <th className="py-3 font-bold text-right">Net Wt</th>
                                    <th className="py-3 font-bold text-right">Rate</th>
                                    <th className="py-3 font-bold text-right">Making</th>
                                    <th className="py-3 font-bold text-right pr-2">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700">
                                {items.map((item: any, i: number) => {
                                    const netWeight = Number(item.netWeight) || 0;
                                    const rate = Number(item.rate) || 0;
                                    const making = Number(item.making) || 0;
                                    const total = (netWeight * rate) + (netWeight * making);
                                    return (
                                        <tr key={item.id || i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 pl-2 font-medium">
                                                <div className="text-slate-900">{item.description || "Item"}</div>
                                            </td>
                                            <td className="py-4 px-2 text-center">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium">{item.purity}K</span>
                                            </td>
                                            <td className="py-4 px-2 text-right font-mono text-slate-600">{netWeight.toFixed(3)} g</td>
                                            <td className="py-4 px-2 text-right font-mono text-slate-600">{formatCurrency(rate)}</td>
                                            <td className="py-4 px-2 text-right font-mono text-slate-600">{formatCurrency(making * netWeight)}</td>
                                            <td className="py-4 pr-2 text-right font-bold text-slate-900 font-mono">{formatCurrency(total)}</td>
                                        </tr>
                                    );
                                })}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-300 italic">No items added yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-12">
                        <div className="w-full sm:w-1/2 bg-slate-50 p-6 rounded-xl space-y-3">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-mono">{formatCurrency(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Discount</span>
                                    <span className="font-mono">-{formatCurrency(discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-500 text-[11px]">
                                <span>SGST ({sgstRate}%)</span>
                                <span className="font-mono">{formatCurrency(sgstAmount)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 text-[11px]">
                                <span>CGST ({cgstRate}%)</span>
                                <span className="font-mono">{formatCurrency(cgstAmount)}</span>
                            </div>
                            <Separator className="my-2 bg-slate-200" />
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Grand Total</span>
                                <span className="text-xl font-bold text-slate-900 font-mono">{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-900 font-medium mb-2">Thank you for your business!</p>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest">Terms & Conditions Apply</p>
                    </div>
                </div>

                {/* Bottom Gold Bar */}
                <div className="h-1 w-full bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37]"></div>
            </CardContent>
        </Card>
    );
}
