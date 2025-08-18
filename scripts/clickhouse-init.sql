-- Initial database setup for Steam Bot
CREATE DATABASE IF NOT EXISTS steam_bot;

-- Create user for the application
CREATE USER IF NOT EXISTS steam_bot IDENTIFIED BY 'steam_bot_password';
GRANT ALL ON steam_bot.* TO steam_bot;

-- Use the steam_bot database
USE steam_bot;

-- Events table for event sourcing
CREATE TABLE IF NOT EXISTS events (
    id String,
    type String,
    payload String,
    meta_schema_version String,
    meta_id String,
    meta_ts UInt64,
    meta_aggregate String,
    meta_kind String,
    timestamp UInt64
) ENGINE = MergeTree()
ORDER BY (meta_aggregate, timestamp)
PARTITION BY toYYYYMM(toDateTime(timestamp / 1000));

-- Snapshots table for state storage
CREATE TABLE IF NOT EXISTS snapshots (
    id String,
    state String,
    timestamp UInt64,
    version UInt32
) ENGINE = ReplacingMergeTree(version)
ORDER BY (id, timestamp)
PARTITION BY toYYYYMM(toDateTime(timestamp / 1000));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_type ON events (type) TYPE bloom_filter GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_events_aggregate ON events (meta_aggregate) TYPE bloom_filter GRANULARITY 1;
CREATE INDEX IF NOT EXISTS idx_snapshots_id ON snapshots (id) TYPE bloom_filter GRANULARITY 1;