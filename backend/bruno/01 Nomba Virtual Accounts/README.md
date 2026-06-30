# Virtual Account Requests

`companyName` and `phoneNumber` are optional. Request payloads use camelCase only. The database column for optional phone numbers must still exist, but it can be `null`. When a phone number is provided, it must be unique across users.

The create request includes them as sample fields. Frontend can omit them when the user does not provide those details. Use `Create Virtual Account - Without Phone Number` to test a request where company is provided and phone number is omitted.

Accepted optional fields:

```json
{
  "companyName": "Acme Labs",
  "phoneNumber": "+2348012345678"
}
```
