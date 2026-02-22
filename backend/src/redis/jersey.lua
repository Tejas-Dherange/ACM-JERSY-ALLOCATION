-- Jersey Reservation Lua Script
-- Keys:
--   KEYS[1] = jersey:taken (SET of taken jersey numbers)
--   KEYS[2] = jersey:user:<userId> (STRING mapping user to jersey)
--   KEYS[3] = jersey:locked (HASH of locked jerseys: number -> userId)
-- Args:
--   ARGV[1] = userId
--   ARGV[2] = jerseyNumber (string)
--   ARGV[3] = lockTTL in seconds (30)

-- Check if this user already has a jersey (locked or taken)
local existingJersey = redis.call('GET', KEYS[2])
if existingJersey then
  return {-1, 'USER_ALREADY_HAS_JERSEY'}
end

-- Check if jersey is already taken (permanent)
local isTaken = redis.call('SISMEMBER', KEYS[1], ARGV[2])
if isTaken == 1 then
  return {-2, 'JERSEY_TAKEN'}
end

-- Check if jersey has a temporary lock
local lockedBy = redis.call('HGET', KEYS[3], ARGV[2])
if lockedBy then
  return {-3, 'JERSEY_LOCKED'}
end

-- All checks passed — atomically lock this jersey
redis.call('HSET', KEYS[3], ARGV[2], ARGV[1])
-- Also record user -> jersey mapping (for duplicate check)
local ttl = tonumber(ARGV[3])
if ttl > 0 then
  redis.call('SET', KEYS[2], ARGV[2], 'EX', ttl)
else
  redis.call('SET', KEYS[2], ARGV[2])
end

return {1, 'LOCKED'}
