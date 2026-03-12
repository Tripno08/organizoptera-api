#!/bin/bash
# Load test environment and run single test

set -a
source .env.test
set +a

npx vitest run test/auth.e2e-spec.ts -t "should return JWT token on valid credentials" "$@"
