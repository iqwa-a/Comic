// Uji inti auth admin: token valid/tamper/kedaluwarsa + verifikasi password.
// Jalankan dengan ADMIN_PASSWORD diset sebelum import: lihat check:core di package.json.
process.env.ADMIN_PASSWORD = "test-pass-123";
process.env.ADMIN_SECRET = "test-secret";

import { strict as assert } from "node:assert";
import { createToken, verifyPassword, verifyToken } from "./admin-auth";

// Password: benar diterima, salah ditolak.
assert.equal(verifyPassword("test-pass-123"), true);
assert.equal(verifyPassword("salah"), false);
assert.equal(verifyPassword(""), false);

// Token: baru valid, diubah tidak valid, kedaluwarsa tidak valid.
assert.equal(verifyToken(createToken()), true);
assert.equal(verifyToken("9999999999999.tampered-mac"), false);
const expired = createToken().split(".")[0];
const realMac = createToken().split(".")[1];
assert.equal(verifyToken(`${Number(expired) - 1000}.${realMac}`), false);
assert.equal(verifyToken(undefined), false);

console.log("admin-auth: semua tes lolos");
