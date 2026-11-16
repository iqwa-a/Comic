import assert from "node:assert/strict";
import { allowedImageUrl, countryName, isPublicIPv4, isSource } from "./comics";

assert.equal(isSource("mangadex"), true);
assert.equal(isSource("unknown"), false);
assert.equal(countryName("ja"), "Jepang");
assert.equal(countryName("KR"), "Korea Selatan");
assert.equal(allowedImageUrl("https://assets.shngm.id/cover.jpg"), true);
assert.equal(allowedImageUrl("https://cmdxd98sb0x3yprd.mangadex.network/data/chapter/page.jpg"), true);
assert.equal(allowedImageUrl("https://uploads.mangadex.org/covers/manga/cover.jpg"), true);
assert.equal(allowedImageUrl("http://assets.shngm.id/cover.jpg"), false);
assert.equal(allowedImageUrl("https://localhost/private"), false);
assert.equal(allowedImageUrl("https://evil.example/assets.shngm.id/cover.jpg"), false);
assert.equal(isPublicIPv4("45.129.229.1"), true);
assert.equal(isPublicIPv4("127.0.0.1"), false);
assert.equal(isPublicIPv4("169.254.169.254"), false);
