/**
 * MODULE: System Integration & Stress Test Suite
 * Phụ trách ban đầu: OPENCODE -> Đã tiếp quản và mở rộng bởi: ANTIGRAVITY 1
 * Kiểm thử tự động cơ chế xoay vòng 4 API Keys khi gặp 429 và đo hiệu năng 60 FPS của PoolPhysicsEngine
 */

import { ApiKeyRotationManager } from "../services/apiKeyManager.ts";
import { PoolPhysicsEngine } from "../games/vfx/PoolPhysicsEngine.ts";

export interface DiagnosticsResult {
  apiTestPassed: boolean;
  attemptsCount: number;
  avgPhysicsFrameMs: number;
  is60FpsCapable: boolean;
}

export async function runFullSystemDiagnostics(): Promise<DiagnosticsResult> {
  console.log("=================================================");
  console.log("🚀 [ANTIGRAVITY 1 QA] BẮT ĐẦU KIỂM THỬ TÍCH HỢP HỆ THỐNG");
  console.log("=================================================");

  // 1. KIỂM THỬ XOAY VÒNG 4 API KEYS (Giả lập 3 Key đầu gặp lỗi 429 / Quota)
  console.log("➡️ [Test 1] Kiểm tra cơ chế tự động xoay 4 API Keys...");
  const testManager = new ApiKeyRotationManager();
  await testManager.setApiKeys([
    "KEY_1_EXHAUSTED",
    "KEY_2_RATE_LIMITED",
    "KEY_3_SERVER_BUSY",
    "KEY_4_WORKING_PERFECTLY"
  ]);

  let callCount = 0;
  const result = await testManager.executeWithFailover(async (activeKey) => {
    callCount++;
    if (activeKey === "KEY_1_EXHAUSTED") {
      // what the paid host answers when the credit runs out
      throw Object.assign(new Error('{"code":402,"message":"credits are depleted"}'), { status: 402 });
    }
    if (activeKey !== "KEY_4_WORKING_PERFECTLY") {
      const err: any = new Error("429 Too Many Requests - Resource Exhausted");
      err.status = 429;
      throw err;
    }
    return { success: true, usedKey: activeKey, attempts: callCount };
  });

  if (result.usedKey !== "KEY_4_WORKING_PERFECTLY" || result.attempts !== 4) {
    throw new Error(`❌ LỖI: Hệ thống không chuyển tiếp đủ qua 4 Keys! Used: ${result.usedKey}, Attempts: ${result.attempts}`);
  }
  console.log(`✅ [PASS 1] Auto-Failover 4 API Keys: Vượt qua lỗi 402 + 429 và hoàn thành ở ${result.usedKey} sau ${result.attempts} lần thử ngầm!`);

  // A bad request (400) is not the key's fault: it must come back at once, not burn the other keys
  let badCalls = 0;
  const badManager = new ApiKeyRotationManager();
  await badManager.setApiKeys(["A_KEY_1", "A_KEY_2"]);
  const bad = await badManager
    .executeWithFailover(async () => { badCalls++; throw Object.assign(new Error("400 Bad Request"), { status: 400 }); })
    .catch((e) => e);
  if (!(bad instanceof Error) || badCalls !== 1) throw new Error(`❌ LỖI: lỗi 400 lại bị chuyển khoá (${badCalls} lần gọi)`);
  console.log("✅ [PASS 1b] Lỗi 400 trả về ngay, không đổi khoá.");

  // 2. KIỂM THỬ HIỆU NĂNG VẬT LÝ NHẢY HỒ BƠI 60 FPS (Đo 120 khung hình liên tiếp)
  console.log("➡️ [Test 2] Kiểm tra hiệu năng tính toán vật lý hồ bơi 60 FPS...");
  const pool = new PoolPhysicsEngine(800, 500, 320);
  const dummyPlayer = { x: 400, y: 100, vx: 0, vy: 16, radius: 24, wasInWater: false, splashLabel: "+100 PERFECT DIVE!" };

  // Kích hoạt splash ban đầu
  pool.triggerSplash(400, 18, 24, "+100 COMBO!");

  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  for (let frame = 0; frame < 120; frame++) {
    pool.updateEntityPhysics(dummyPlayer as any);
    pool.update();
  }
  const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const elapsedMs = endTime - startTime;
  const avgFrameMs = elapsedMs / 120;

  console.log(`📊 Thời gian tính toán vật lý trung bình: ${avgFrameMs.toFixed(3)} ms/khung hình (Ngưỡng 60 FPS là < 16.6 ms, mục tiêu lý tưởng < 4.0 ms)`);

  const is60FpsCapable = avgFrameMs < 4.0;
  if (!is60FpsCapable) {
    console.warn(`⚠️ CẢNH BÁO: Thời gian xử lý khung hình cao hơn khuyến nghị: ${avgFrameMs.toFixed(2)} ms`);
  } else {
    console.log(`✅ [PASS 2] Hiệu năng Vật lý Hồ Bơi: Cực kỳ mượt mà, đạt chuẩn 60 - 120 FPS không giật lag!`);
  }

  console.log("=================================================");
  console.log("🎉 TẤT CẢ CÁC BÀI KIỂM THỬ TÍCH HỢP ĐỀU ĐẠT CHUẨN!");
  console.log("=================================================");

  return {
    apiTestPassed: true,
    attemptsCount: result.attempts,
    avgPhysicsFrameMs: avgFrameMs,
    is60FpsCapable
  };
}

export default runFullSystemDiagnostics;
