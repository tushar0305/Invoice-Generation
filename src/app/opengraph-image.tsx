import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const dynamic = 'force-static';

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
                    fontFamily: 'serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            background: 'linear-gradient(to bottom right, #fbbf24, #d97706)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 30px rgba(217, 119, 6, 0.3)',
                            marginRight: '20px',
                        }}
                    >
                        <span style={{ color: 'white', fontSize: '48px', fontWeight: 'bold' }}>S</span>
                    </div>
                    <h1
                        style={{
                            fontSize: '80px',
                            fontWeight: 'bold',
                            background: 'linear-gradient(to right, #0f172a, #334155)',
                            backgroundClip: 'text',
                            color: 'transparent',
                            margin: 0,
                        }}
                    >
                        SwarnaVyapar
                    </h1>
                </div>
                <p
                    style={{
                        fontSize: '32px',
                        color: '#475569',
                        textAlign: 'center',
                        maxWidth: '800px',
                        lineHeight: 1.4,
                    }}
                >
                    India's Most Premium Jewellery Management Suite
                </p>
                <div
                    style={{
                        marginTop: '40px',
                        display: 'flex',
                        gap: '20px',
                    }}
                >
                    <div style={{ padding: '10px 20px', background: '#f1f5f9', borderRadius: '10px', color: '#334155', fontSize: '20px' }}>Invoicing</div>
                    <div style={{ padding: '10px 20px', background: '#f1f5f9', borderRadius: '10px', color: '#334155', fontSize: '20px' }}>Inventory</div>
                    <div style={{ padding: '10px 20px', background: '#f1f5f9', borderRadius: '10px', color: '#334155', fontSize: '20px' }}>CRM</div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
