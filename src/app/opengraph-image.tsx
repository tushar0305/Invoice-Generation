import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'SwarnaVyapar - Premium Jewellery Management';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #fff, #f8fafc)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, system-ui, -apple-system, Arial, sans-serif',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                    {/* Use browser.webp for better Google search visibility */}
                    <img
                        src="https://swarnavyapar.in/logo/browser.webp"
                        alt="SwarnaVyapar"
                        width={160}
                        height={160}
                        style={{ borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}
                    />
                    <h1
                        style={{
                            fontSize: 72,
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: 0,
                            letterSpacing: -1,
                        }}
                    >
                        SwarnaVyapar
                    </h1>
                </div>
                <p
                    style={{
                        fontSize: 28,
                        color: '#475569',
                        textAlign: 'center',
                        maxWidth: '900px',
                        lineHeight: 1.4,
                        margin: '0 40px',
                    }}
                >
                    India's Most Premium Jewellery Management Suite — Invoicing, Inventory, CRM.
                </p>
            </div>
        ),
        {
            ...size,
        }
    );
}
