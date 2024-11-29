import gql from "graphql-tag";

export const DOORDASH_CONFIG_FRAGMENT = gql`
  fragment DoordashConfig on DoordashConfig {
    id
    createdAt
    updatedAt
    sandbox
    enabled
    apiEndpoint
    developerId
    keyId
    signingSecret
    state
    status
  }
`;
