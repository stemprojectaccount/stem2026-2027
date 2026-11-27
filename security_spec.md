# Security Specification: SmartStudy Firebase Integration

## 1. Data Invariants
- Each user profile at `/users/{userId}` belongs exclusively to the user with `request.auth.uid == userId`.
- User data documents cannot be read, updated, or deleted by any other user.
- Unauthenticated access to user data documents is strictly forbidden.
- The `uid` field is immutable and cannot be tampered with.
- The test document `/test/connection` can be read to verify server connectivity on application boot.
- All IDs must be valid alphanumeric strings of maximum 128 characters (`^[a-zA-Z0-9_\\-]+$`).

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Read**: Attempting to read `/users/user123` without auth token -> PERMISSION_DENIED.
2. **Unauthenticated Write**: Attempting to create or update `/users/user123` without auth token -> PERMISSION_DENIED.
3. **Cross-User Snooping**: Authenticated User A attempting to read `/users/userB` -> PERMISSION_DENIED.
4. **Cross-User Impersonation Write**: Authenticated User A attempting to create `/users/userB` -> PERMISSION_DENIED.
5. **Cross-User Modification**: Authenticated User A attempting to update `/users/userB` -> PERMISSION_DENIED.
6. **Cross-User Deletion**: Authenticated User A attempting to delete `/users/userB` -> PERMISSION_DENIED.
7. **UID Spoofing**: User A creating `/users/userA` with payload `{ uid: "userB" }` -> PERMISSION_DENIED.
8. **UID Tampering on Update**: User A updating `/users/userA` with payload `{ uid: "userC" }` -> PERMISSION_DENIED.
9. **Missing Required UID**: User A creating `/users/userA` without `uid` field -> PERMISSION_DENIED.
10. **Malicious Document ID Injection**: Document ID containing traversal or injection characters like `/users/..%2Fadmin` -> PERMISSION_DENIED.
11. **Excessive String Length (Denial of Wallet)**: Providing display name or email with over 10,000 characters -> PERMISSION_DENIED.
12. **Blanket Collection Listing**: Client attempting to query all documents in `/users` -> PERMISSION_DENIED.

## 3. Security Implementation Plan
- `rules_version = '2';`
- Default deny catch-all `match /{document=**} { allow read, write: if false; }`
- Per-user ownership check: `isOwner(userId)`
- Helper `isValidUser(incoming())` verifying required fields and type boundaries.
