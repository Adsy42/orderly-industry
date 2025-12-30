#!/bin/bash
# Quick test script for document search API

echo "========================================"
echo "Testing Document Search APIs"
echo "========================================"
echo ""

# Test the legacy search endpoint
echo "1. Testing /api/search endpoint (legacy):"
echo "----------------------------------------"
RESULT=$(curl -s -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "matterId": "25e70284-6124-4ad5-925c-cf75aca8501b",
    "query": "GitHub terms of service",
    "limit": 3
  }')

echo "$RESULT" | jq -r 'if .error then "ERROR: \(.error)" else "Found \(.totalCandidates // 0) candidates" end'
echo "$RESULT" | jq -r '.results[:2][] | "  - \(.filename): \(.similarity | (. * 100) | floor)% similarity"' 2>/dev/null

echo ""
echo "2. Testing /api/documents/search endpoint (new with citations):"
echo "---------------------------------------------------------------"
RESULT2=$(curl -s -X POST http://localhost:3001/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "GitHub terms",
    "matter_id": "25e70284-6124-4ad5-925c-cf75aca8501b",
    "semantic_weight": 0.7,
    "match_count": 3
  }')

echo "$RESULT2" | jq -r 'if .error then "ERROR: \(.error)" else "Found \(.total_count // 0) results, search type: \(.search_type)" end'
echo "$RESULT2" | jq -r '.results[:2][] | "  - [\(.formatted_citation.short // .filename)]: score \(.score | (. * 100) | floor)%"' 2>/dev/null

echo ""
echo "========================================"
echo "Test Citation Format in Chat"
echo "========================================"
echo ""
echo "In the chat, the agent should output citations like:"
echo ""
echo '  According to [test.txt, § 0](cite:3f8d8698-a421-488a-a697-a6e7553283a7),'
echo '  the GitHub Terms of Service govern use of the platform.'
echo ""
echo "These will render as clickable links with a file icon!"
echo ""
echo "Done!"

