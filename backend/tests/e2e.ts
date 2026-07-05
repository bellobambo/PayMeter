import { app } from '../src/app.js';
import { supabase } from '../src/config/supabase.js';

const PORT = 5001;

async function runHttpTests() {
    console.log('🚀 Starting E2E HTTP Integration Test Suite...');

    // Start the server in-process
    const server = app.listen(PORT, async () => {
        console.log(`   Express test server listening on port ${PORT}`);

        const testSuffix = Math.floor(Math.random() * 1000000);
        const founderEmail = `founder-${testSuffix}@paymeter.local`;
        const founderPassword = 'securepassword123';
        const founderName = 'Tunde E2E Founder';
        const internalUserId = `end-user-${testSuffix}`;
        const featureName = 'Caption Generation';
        const featurePrice = 50;

        let token = '';
        let featureId = '';
        let userId = '';

        try {
            // 1. Register Founder via HTTP
            console.log(`\n1. POST /api/founders/register...`);
            const regRes = await fetch(`http://localhost:${PORT}/api/founders/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: founderName,
                    email: founderEmail,
                    password: founderPassword,
                }),
            });

            const regData = (await regRes.json()) as any;
            if (!regRes.ok || !regData.success) {
                throw new Error(`Founder registration failed: ${JSON.stringify(regData)}`);
            }
            token = regData.data.token;
            const founderId = regData.data.founder.id;
            console.log(`   ✅ Founder registered successfully via HTTP! ID: ${founderId}`);

            // 2. Login Founder via HTTP
            console.log(`\n2. POST /api/founders/login...`);
            const loginRes = await fetch(`http://localhost:${PORT}/api/founders/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: founderEmail,
                    password: founderPassword,
                }),
            });
            const loginData = (await loginRes.json()) as any;
            if (!loginRes.ok || !loginData.success) {
                throw new Error(`Founder login failed: ${JSON.stringify(loginData)}`);
            }
            console.log('   ✅ Founder logged in successfully! Token received.');

            // 3. Create Feature via HTTP
            console.log(`\n3. POST /api/features...`);
            const featRes = await fetch(`http://localhost:${PORT}/api/features`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: featureName,
                    price: featurePrice,
                }),
            });
            const featData = (await featRes.json()) as any;
            if (!featRes.ok || !featData.success) {
                throw new Error(`Feature creation failed: ${JSON.stringify(featData)}`);
            }
            featureId = featData.data.id;
            console.log(`   ✅ Feature defined via HTTP! ID: ${featureId}, Price: ₦${featData.data.price}`);

            // 4. Mock user registration in Database (to bypass Nomba Virtual Account API)
            console.log('\n4. Registering user in database directly...');
            const { data: dbUser, error: dbUserErr } = await supabase
                .from('users')
                .insert({
                    internal_user_id: internalUserId,
                    name: 'Amaka E2E Test',
                    email: `amaka-${testSuffix}@example.com`,
                })
                .select('*')
                .single();

            if (dbUserErr || !dbUser) {
                throw new Error(`Failed to insert user: ${dbUserErr?.message}`);
            }
            userId = dbUser.id;

            // Initialize balance
            await supabase.from('balances').insert({
                user_id: userId,
                internal_user_id: internalUserId,
                amount: 0,
            });
            console.log('   ✅ Mock user registered and balance initialized to ₦0.');

            // 5. Credit user balance via RPC
            const topupAmount = 120;
            console.log(`\n5. Crediting user balance with ₦${topupAmount} via credit RPC...`);
            const { data: creditResult } = await supabase.rpc('credit_user_balance', {
                p_internal_user_id: internalUserId,
                p_amount: topupAmount,
            });
            console.log('   ✅ Credit result:', creditResult);

            // 6. Concurrency check via HTTP POST /api/meter
            console.log(`\n6. Concurrency check: Firing 5 concurrent POST /api/meter requests...`);
            console.log(`   Initial balance: ₦120. Expected successes: 2. Expected failures: 3.`);

            const meterPromises = Array.from({ length: 5 }).map(async (_, idx) => {
                const res = await fetch(`http://localhost:${PORT}/api/meter`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: internalUserId,
                        featureName: featureName,
                        founderId,
                    }),
                });
                const data = (await res.json()) as any;
                return { idx: idx + 1, ok: res.ok, status: res.status, data };
            });

            const results = await Promise.all(meterPromises);

            let successes = 0;
            let failures = 0;

            results.forEach((r) => {
                console.log(`      👉 Request ${r.idx}: Status ${r.status} - ${r.ok ? '✅ ALLOWED' : '❌ DENIED (' + (r.data.errors?.reason || r.data.message) + ')'}`);
                if (r.ok) successes++;
                else failures++;
            });

            console.log(`   Summary: Successes: ${successes}, Failures: ${failures}`);
            if (successes !== 2) {
                throw new Error(`Concurrency check failed. Expected 2 allowed but got ${successes}`);
            }
            console.log('   ✅ Concurrency locks verified successfully via HTTP!');

            // 7. GET /api/users/:userId/balance via HTTP
            console.log(`\n7. GET /api/users/${internalUserId}/balance...`);
            const balRes = await fetch(`http://localhost:${PORT}/api/users/${internalUserId}/balance`);
            const balData = (await balRes.json()) as any;
            if (!balRes.ok || !balData.success) {
                throw new Error(`Failed to fetch user balance: ${JSON.stringify(balData)}`);
            }
            console.log('   ✅ Balance data received:');
            console.log(`      - Current Balance: ₦${balData.data.balance}`);
            console.log(`      - Recent Usage count: ${balData.data.usageHistory.length}`);
            console.log(`      - Recent Funding count: ${balData.data.fundingHistory.length}`);

            if (balData.data.balance !== 20) {
                throw new Error(`Expected balance 20 NGN but got ${balData.data.balance}`);
            }

            // 8. GET /api/founders/analytics via HTTP
            console.log('\n8. GET /api/founders/analytics...');
            const analRes = await fetch(`http://localhost:${PORT}/api/founders/analytics`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const analData = (await analRes.json()) as any;
            if (!analRes.ok || !analData.success) {
                throw new Error(`Failed to fetch analytics: ${JSON.stringify(analData)}`);
            }
            console.log('   ✅ Analytics data received:');
            console.log(`      - Total Revenue: ₦${analData.data.totalRevenue}`);
            console.log(`      - Active Users: ${analData.data.activeUsersCount}`);
            console.log('      - Feature breakdowns:', analData.data.featuresBreakdown);

            if (analData.data.totalRevenue !== 100) {
                throw new Error(`Expected total revenue 100 but got ${analData.data.totalRevenue}`);
            }

            console.log('\n🎉 ALL E2E HTTP INTEGRATION TESTS PASSED SUCCESSFULLY!');
            console.log('⚠️  Skipped database cleanup to inspect test records in the dashboard!');
            console.log(`   Founder email: ${founderEmail}`);
            console.log(`   End User internal ID: ${internalUserId}`);
            console.log(`   Feature name: ${featureName}`);

        } catch (e) {
            console.error('\n❌ HTTP Tests failed:', e);
            console.log('🧹 Cleaning up due to test failure...');
            if (userId) {
                await supabase.from('users').delete().eq('id', userId);
            }
            await supabase.from('founders').delete().eq('email', founderEmail);
        } finally {
            // Close the server and exit the process
            server.close();
            process.exit(0);
        }
    });
}

runHttpTests();
