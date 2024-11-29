import { gql } from 'graphql-tag';

export const adminApiExtensions = gql`
    type DoordashConfig implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        sandbox: Boolean!
        enabled: Boolean!
        apiEndpoint: String!
        developerId: String!
        keyId: String!
        signingSecret: String!
        state: String!
        status: String!
    }

    type DoordashConfigList implements PaginatedList {
        items: [DoordashConfig!]!
        totalItems: Int!
    }

    # Auto-generated at runtime
    input DoordashConfigListOptions

    input SubmitDoordashConfigInput {
        id: ID
        sandbox: Boolean!
        enabled: Boolean!
        apiEndpoint: String!
        developerId: String!
        keyId: String!
        signingSecret: String!
    }

    input UpdateDoordashConfigInput {
        id: ID!
        sandbox: Boolean!
        enabled: Boolean!
        apiEndpoint: String!
        developerId: String!
        keyId: String!
        signingSecret: String!
    }

    extend type Query {
        doordashConfigs(options: DoordashConfigListOptions): DoordashConfigList!
        doordashConfig(id: ID!): DoordashConfig!
        isDoordashConfigValid(input: SubmitDoordashConfigInput!): Boolean
    }

    extend type Mutation {
        submitDoordashConfig(input: SubmitDoordashConfigInput!): DoordashConfig!
        upsertDoordashConfig(input: UpdateDoordashConfigInput!): DoordashConfig!
    }
`;