# Roads carry abstracted utilities

Use independent connected road components. Power and water plants connect to orthogonally adjacent roads; districts reserve maximum capacity on one eligible adjacent network. This keeps network cuts meaningful without separate pipe/wire micro-management. Capacity is allocated in stable tile order; adding another plant restores undersupplied districts deterministically. Traffic is abstracted as road access, not vehicles or congestion.
