# Nomba Money

Requests for balance checks, bank lookup, and transfer initiation.

Use `Lookup Bank Account` before `Initiate Bank Transfer`, then copy the returned
`accountName` into the transfer payload.

`merchantTxRef` must be unique per transfer.
