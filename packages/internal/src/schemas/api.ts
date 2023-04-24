import { z } from "zod";
import { DeserializedJsonSchema, SerializableJsonSchema } from "./json";
import { CachedTaskSchema, ServerTaskSchema, TaskSchema } from "./tasks";
import { TriggerMetadataSchema } from "./triggers";
import { ulid } from "ulid";
import { DisplayElementSchema } from "./elements";
import { ConnectionAuthSchema, ConnectionMetadataSchema } from "./connections";

export const RegisterHttpEventSourceBodySchema = z.object({
  key: z.string(),
  connectionId: z.string().optional(),
});

export type RegisterHttpEventSourceBody = z.infer<
  typeof RegisterHttpEventSourceBodySchema
>;

export const UpdateHttpEventSourceBodySchema =
  RegisterHttpEventSourceBodySchema.omit({ key: true }).extend({
    secret: z.string().optional(),
    data: SerializableJsonSchema.optional(),
    active: z.boolean().optional(),
  });

export type UpdateHttpEventSourceBody = z.infer<
  typeof UpdateHttpEventSourceBodySchema
>;

export const HttpEventSourceSchema = UpdateHttpEventSourceBodySchema.extend({
  id: z.string(),
  active: z.boolean(),
  url: z.string().url(),
});

export type HttpEventSource = z.infer<typeof HttpEventSourceSchema>;

export const HttpSourceRequestSchema = z.object({
  url: z.string().url(),
  method: z.string(),
  headers: z.record(z.string()),
  rawBody: z.instanceof(Buffer).optional().nullable(),
});

export type HttpSourceRequest = z.infer<typeof HttpSourceRequestSchema>;

// "x-trigger-key": options.key,
// "x-trigger-auth": JSON.stringify(options.auth),
// "x-trigger-url": options.request.url,
// "x-trigger-method": options.request.method,
// "x-trigger-headers": JSON.stringify(options.request.headers),
// ...(options.secret ? { "x-trigger-secret": options.secret } : {}),
export const HttpSourceRequestHeadersSchema = z.object({
  "x-trigger-key": z.string(),
  "x-trigger-auth": z
    .string()
    .optional()
    .transform((s) => (s ? ConnectionAuthSchema.parse(s) : undefined)),
  "x-trigger-url": z.string(),
  "x-trigger-method": z.string(),
  "x-trigger-headers": z
    .string()
    .transform((s) => z.record(z.string()).parse(JSON.parse(s))),
  "x-trigger-secret": z.string().optional(),
});

export type HttpSourceRequestHeaders = z.output<
  typeof HttpSourceRequestHeadersSchema
>;

export const PongResponseSchema = z.object({
  message: z.literal("PONG"),
});

export const JobSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  trigger: TriggerMetadataSchema,
  connections: z.array(
    z.object({
      key: z.string(),
      metadata: ConnectionMetadataSchema,
      usesLocalAuth: z.boolean().default(false),
    })
  ),
  supportsPreparation: z.boolean(),
});

export type ApiJob = z.infer<typeof JobSchema>;

export const GetJobResponseSchema = z.object({
  job: JobSchema,
});

export const GetJobsResponseSchema = z.object({
  jobs: z.array(JobSchema),
});

export const RawEventSchema = z.object({
  id: z.string().default(() => ulid()),
  name: z.string(),
  source: z.string().default("trigger.dev"),
  payload: DeserializedJsonSchema,
  context: DeserializedJsonSchema.optional(),
  timestamp: z.string().datetime().optional(),
});

export type RawEvent = z.infer<typeof RawEventSchema>;
export type SendEvent = z.input<typeof RawEventSchema>;

export const ApiEventLogSchema = z.object({
  id: z.string(),
  name: z.string(),
  payload: DeserializedJsonSchema,
  context: DeserializedJsonSchema.optional().nullable(),
  timestamp: z.coerce.date(),
  deliverAt: z.coerce.date().optional().nullable(),
  deliveredAt: z.coerce.date().optional().nullable(),
});

export type ApiEventLog = z.infer<typeof ApiEventLogSchema>;

export const SendEventOptionsSchema = z.object({
  deliverAt: z.string().datetime().optional(),
  deliverAfter: z.number().int().optional(),
});

export const SendEventBodySchema = z.object({
  event: RawEventSchema,
  options: SendEventOptionsSchema.optional(),
});

export type SendEventBody = z.infer<typeof SendEventBodySchema>;
export type SendEventOptions = z.infer<typeof SendEventOptionsSchema>;

export const DeliverEventResponseSchema = z.object({
  deliveredAt: z.string().datetime(),
});

export type DeliverEventResponse = z.infer<typeof DeliverEventResponseSchema>;

export const ExecuteJobBodySchema = z.object({
  event: ApiEventLogSchema,
  job: z.object({
    id: z.string(),
    version: z.string(),
  }),
  context: z.object({
    id: z.string(),
    environment: z.string(),
    organization: z.string(),
    isTest: z.boolean(),
    version: z.string(),
    startedAt: z.coerce.date(),
  }),
  tasks: z.array(CachedTaskSchema).optional(),
  connections: z.record(ConnectionAuthSchema).optional(),
});

export type ExecuteJobBody = z.infer<typeof ExecuteJobBodySchema>;

export const ExecuteJobResponseSchema = z.object({
  executionId: z.string(),
  completed: z.boolean(),
  output: DeserializedJsonSchema.optional(),
  task: TaskSchema.optional(),
});

export type ExecuteJobResponse = z.infer<typeof ExecuteJobResponseSchema>;

export const CreateExecutionBodySchema = z.object({
  client: z.string(),
  job: JobSchema,
  event: ApiEventLogSchema,
  elements: z.array(DisplayElementSchema).optional(),
});

export type CreateExecutionBody = z.infer<typeof CreateExecutionBodySchema>;

const CreateExecutionResponseOkSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    id: z.string(),
  }),
});

const CreateExecutionResponseErrorSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export const CreateExecutionResponseBodySchema = z.discriminatedUnion("ok", [
  CreateExecutionResponseOkSchema,
  CreateExecutionResponseErrorSchema,
]);

export type CreateExecutionResponseBody = z.infer<
  typeof CreateExecutionResponseBodySchema
>;

export const SecureStringSchema = z.object({
  __secureString: z.literal(true),
  strings: z.array(z.string()),
  interpolations: z.array(z.string()),
});

export const PrepareForJobExecutionBodySchema = z.object({
  id: z.string(),
  version: z.string(),
  connections: z.record(ConnectionAuthSchema),
});

export type PrepareForJobExecutionBody = z.infer<
  typeof PrepareForJobExecutionBodySchema
>;

export const PrepareForJobExecutionResponseSchema = z.object({
  ok: z.boolean(),
});

export type PrepareForJobExecutionResponse = z.infer<
  typeof PrepareForJobExecutionResponseSchema
>;

export type SecureString = z.infer<typeof SecureStringSchema>;

export const LogMessageSchema = z.object({
  level: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]),
  message: z.string(),
  data: SerializableJsonSchema.optional(),
});

export type LogMessage = z.infer<typeof LogMessageSchema>;

export type ClientTask = z.infer<typeof TaskSchema>;
export type ServerTask = z.infer<typeof ServerTaskSchema>;
export type CachedTask = z.infer<typeof CachedTaskSchema>;

export const IOTaskSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  displayKey: z.string().optional(),
  noop: z.boolean().default(false),
  delayUntil: z.coerce.date().optional(),
  description: z.string().optional(),
  elements: z.array(DisplayElementSchema).optional(),
  params: SerializableJsonSchema.optional(),
});

export type IOTask = z.input<typeof IOTaskSchema>;

export const RunTaskBodyInputSchema = IOTaskSchema.extend({
  idempotencyKey: z.string(),
});

export type RunTaskBodyInput = z.infer<typeof RunTaskBodyInputSchema>;

export const RunTaskBodyOutputSchema = RunTaskBodyInputSchema.extend({
  params: DeserializedJsonSchema.optional().nullable(),
});

export type RunTaskBodyOutput = z.infer<typeof RunTaskBodyOutputSchema>;

export const CompleteTaskBodyInputSchema = RunTaskBodyInputSchema.pick({
  elements: true,
  description: true,
  params: true,
}).extend({
  output: SerializableJsonSchema.optional().transform((v) =>
    DeserializedJsonSchema.parse(JSON.parse(JSON.stringify(v)))
  ),
});

export type CompleteTaskBodyInput = z.input<typeof CompleteTaskBodyInputSchema>;
export type CompleteTaskBodyOutput = z.infer<
  typeof CompleteTaskBodyInputSchema
>;

export const NormalizedRequestSchema = z.object({
  headers: z.record(z.string()),
  method: z.string(),
  query: z.record(z.string()),
  url: z.string(),
  body: z.any(),
});

export type NormalizedRequest = z.infer<typeof NormalizedRequestSchema>;

export const NormalizedResponseSchema = z.object({
  status: z.number(),
  body: z.any(),
  headers: z.record(z.string()).optional(),
});

export type NormalizedResponse = z.infer<typeof NormalizedResponseSchema>;

export const HttpSourceResponseSchema = z.object({
  response: NormalizedResponseSchema,
  events: z.array(RawEventSchema),
});