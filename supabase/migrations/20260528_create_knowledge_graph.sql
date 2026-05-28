-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Nodes Table
CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_type TEXT NOT NULL,
  name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(node_type, name)
);

-- 2. Edges Table
CREATE TABLE knowledge_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  target_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, target_id, relationship_type)
);

-- 3. Performance Indexes
CREATE INDEX idx_nodes_type_name ON knowledge_nodes(node_type, name);
CREATE INDEX idx_edges_source ON knowledge_edges(source_id);
CREATE INDEX idx_edges_target ON knowledge_edges(target_id);
CREATE INDEX idx_edges_relationship ON knowledge_edges(relationship_type);

-- 4. Row Level Security
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for nodes" ON knowledge_nodes FOR SELECT USING (true);
CREATE POLICY "Public read access for edges" ON knowledge_edges FOR SELECT USING (true);
