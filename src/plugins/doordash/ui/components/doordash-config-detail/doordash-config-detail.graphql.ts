import { graphql } from '../../gql';

export const CREATE_CONFIG = graphql(`
    mutation SubmitDoordashConfig($input: SubmitDoordashConfigInput!) {
        submitDoordashConfig(input: $input) {
            ...DoordashConfig
        }
    }
`);

export const UPSERT_CONFIG = graphql(`
    mutation UpsertDoordashConfig($input: UpdateDoordashConfigInput!) {
        upsertDoordashConfig(input: $input) {
            ...DoordashConfig
        }
    }
`);

export const TEST_CONFIG = graphql(`
    query IsDoordashConfigValid($input: SubmitDoordashConfigInput!) {
        isDoordashConfigValid(input: $input)
    }
`);