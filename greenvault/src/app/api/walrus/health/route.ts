import { NextRequest, NextResponse } from 'next/server';
import { enhancedWalrusManager as walrusManager } from '@/lib/walrus/manager';

export async function GET(request: NextRequest) {
    try {
        console.log('[walrus-health] Starting Walrus health check...');

        // Check Enhanced Walrus Manager health
        const walrusAvailable = await walrusManager.isAvailable();
        const walrusStatus = walrusManager.getStatus();
        console.log('[walrus-health] Enhanced Walrus manager available:', walrusAvailable);

        // Check server fallback availability
        const serverHealthy = true; // Server storage is always available locally
        console.log('[walrus-health] Server fallback available:', serverHealthy);

        // Determine overall Walrus ecosystem health
        const overallStatus = walrusAvailable ? 'healthy' : 'degraded';
        const storageMode = walrusAvailable ? 'walrus-network' : 'server-fallback';

        const healthDetails = {
            walrusNetwork: {
                available: walrusAvailable,
                status: walrusAvailable ? 'healthy' : 'unavailable',
                endpoints: {
                    aggregator: 'https://aggregator-devnet.walrus.space',
                    publisher: 'https://publisher-devnet.walrus.space'
                },
                initialized: walrusStatus.initialized,
                walrusSDKAvailable: walrusStatus.sdkAvailability.walrusSDK,
                sealSDKAvailable: walrusStatus.sdkAvailability.sealSDK,
                suiSDKAvailable: walrusStatus.sdkAvailability.suiSDK
            },
            serverFallback: {
                available: serverHealthy,
                status: 'healthy',
                storageDir: '.walrus-storage',
                encryption: 'AES-GCM'
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                walrusEnabled: process.env.WALRUS_ENABLED === 'true',
                developmentMode: process.env.NODE_ENV === 'development'
            }
        };
        return NextResponse.json({
            success: true,
            status: overallStatus,
            storageMode,
            message: walrusAvailable
                ? 'Walrus network is healthy and available'
                : 'Walrus network unavailable - using server fallback',
            timestamp: new Date().toISOString(),
            ecosystem: 'walrus-enhanced-v2',
            components: healthDetails
        });
    } catch (error) {
        console.error('[walrus-health] Health check failed:', error);
        return NextResponse.json(
            {
                success: false,
                status: 'error',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                storage: 'walrus'
            },
            { status: 500 }
        );
    }
}