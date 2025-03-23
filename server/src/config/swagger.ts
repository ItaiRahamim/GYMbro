import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

// Swagger Definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GYMbro API Documentation',
    version: '1.0.0',
    description: 'This is the API documentation for the GYMbro application',
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC',
    },
    contact: {
      name: 'GYMbro Support',
      email: 'support@gymbro.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server',
    },
    {
      url: 'https://gymbro.com',
      description: 'Production Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT Bearer token in the format: Bearer {token}'
      },
    },
    schemas: {
      User: {
        type: 'object',
        required: ['username', 'email'],
        properties: {
          _id: {
            type: 'string',
            description: 'Auto-generated MongoDB id',
            example: '60d21b4967d0d8992e610c85'
          },
          username: {
            type: 'string',
            description: 'User\'s username',
            example: 'fitness_enthusiast'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User\'s email address',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            description: 'User\'s password (hashed)',
            format: 'password',
          },
          profilePicture: {
            type: 'string',
            description: 'URL to user\'s profile picture',
            example: '/uploads/profiles/default.jpg'
          },
          googleId: {
            type: 'string',
            description: 'Google OAuth ID (if registered via Google)',
            example: '118437672113224439708'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date when user was created',
            example: '2023-06-14T10:12:35Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date when user was last updated',
            example: '2023-06-14T10:12:35Z'
          },
        },
      },
      Post: {
        type: 'object',
        required: ['content', 'user'],
        properties: {
          _id: {
            type: 'string',
            description: 'Auto-generated MongoDB id',
          },
          content: {
            type: 'string',
            description: 'Post content',
          },
          imageUrl: {
            type: 'string',
            description: 'URL to post image (if any)',
          },
          user: {
            type: 'string',
            description: 'ID of the user who created the post',
          },
          commentsCount: {
            type: 'integer',
            description: 'Number of comments on the post',
          },
          likesCount: {
            type: 'integer',
            description: 'Number of likes on the post',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date when post was created',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date when post was last updated',
          },
        },
      },
      Comment: {
        type: 'object',
        required: ['content', 'user', 'post'],
        properties: {
          _id: {
            type: 'string',
            description: 'Auto-generated MongoDB id',
          },
          content: {
            type: 'string',
            description: 'Comment content',
          },
          user: {
            type: 'string',
            description: 'ID of the user who created the comment',
          },
          post: {
            type: 'string',
            description: 'ID of the post the comment belongs to',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date when comment was created',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date when comment was last updated',
          },
        },
      },
      Like: {
        type: 'object',
        required: ['user', 'post'],
        properties: {
          _id: {
            type: 'string',
            description: 'Auto-generated MongoDB id',
            example: '60d21b4967d0d8992e610c87'
          },
          user: {
            type: 'string',
            description: 'ID of the user who liked the post',
            example: '60d21b4967d0d8992e610c85'
          },
          post: {
            type: 'string',
            description: 'ID of the post that was liked',
            example: '60d21b4967d0d8992e610c86'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date when like was created',
            example: '2023-06-14T10:12:35Z'
          },
        },
      },
      AIWorkoutPlan: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Auto-generated MongoDB id',
            example: '60d21b4967d0d8992e610c88'
          },
          user: {
            type: 'string',
            description: 'ID of the user who owns this workout plan',
            example: '60d21b4967d0d8992e610c85'
          },
          title: {
            type: 'string',
            description: 'Title of the workout plan',
            example: 'Advanced 5-Day Split'
          },
          content: {
            type: 'string',
            description: 'Content of the AI-generated workout plan',
            example: 'Day 1: Chest and Triceps\n- Bench Press: 4x8-10\n- Incline Dumbbell Press: 3x10-12\n...'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date when workout plan was created',
            example: '2023-06-14T10:12:35Z'
          },
        },
      },
      AINutritionPlan: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Auto-generated MongoDB id',
            example: '60d21b4967d0d8992e610c89'
          },
          user: {
            type: 'string',
            description: 'ID of the user who owns this nutrition plan',
            example: '60d21b4967d0d8992e610c85'
          },
          title: {
            type: 'string',
            description: 'Title of the nutrition plan',
            example: 'Muscle Building Nutrition Plan'
          },
          content: {
            type: 'string',
            description: 'Content of the AI-generated nutrition plan',
            example: 'Breakfast:\n- 4 egg whites, 1 whole egg\n- 1/2 cup oatmeal\n...'
          },
          calorieTarget: {
            type: 'number',
            description: 'Daily calorie target',
            example: 2500
          },
          macros: {
            type: 'object',
            description: 'Macronutrient targets',
            properties: {
              protein: {
                type: 'number',
                description: 'Protein target in grams',
                example: 200
              },
              carbs: {
                type: 'number',
                description: 'Carbohydrate target in grams',
                example: 300
              },
              fats: {
                type: 'number',
                description: 'Fat target in grams',
                example: 70
              }
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date when nutrition plan was created',
            example: '2023-06-14T10:12:35Z'
          },
        },
      },
      AIResponse: {
        type: 'object',
        properties: {
          result: {
            type: 'string',
            description: 'AI-generated response text',
            example: 'Here is a personalized workout plan based on your goals and fitness level...'
          },
          metadata: {
            type: 'object',
            description: 'Additional metadata about the AI response',
            properties: {
              model: {
                type: 'string',
                description: 'AI model used',
                example: 'Gemini Pro'
              },
              promptTokens: {
                type: 'number',
                description: 'Number of tokens in the prompt',
                example: 350
              },
              completionTokens: {
                type: 'number',
                description: 'Number of tokens in the completion',
                example: 512
              }
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Error message',
            example: 'Something went wrong'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                  description: 'Error specific message',
                  example: 'Email is required'
                },
                param: {
                  type: 'string',
                  description: 'Parameter that caused the error',
                  example: 'email'
                },
                location: {
                  type: 'string',
                  description: 'Location of the error (body, query, etc.)',
                  example: 'body'
                },
              },
            },
            description: 'List of validation errors (if applicable)',
          },
          status: {
            type: 'number',
            description: 'HTTP status code',
            example: 400
          }
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              message: "Unauthorized: Access token is invalid or expired",
              status: 401
            }
          },
        },
      },
      ValidationError: {
        description: 'Validation errors in request data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              message: "Validation failed",
              errors: [
                {
                  msg: "Email is not valid",
                  param: "email",
                  location: "body"
                },
                {
                  msg: "Password must be at least 6 characters",
                  param: "password",
                  location: "body"
                }
              ],
              status: 400
            }
          },
        },
      },
      NotFoundError: {
        description: 'Requested resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              message: "Resource not found",
              status: 404
            }
          },
        },
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              message: "Internal server error",
              status: 500
            }
          },
        },
      },
      SuccessResponse: {
        description: 'Operation completed successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Success message'
                },
                data: {
                  type: 'object',
                  description: 'Response data'
                }
              }
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Auth',
      description: 'Authentication endpoints',
    },
    {
      name: 'Posts',
      description: 'Post management endpoints',
    },
    {
      name: 'Comments',
      description: 'Comment management endpoints',
    },
    {
      name: 'Likes',
      description: 'Post likes endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'AI',
      description: 'AI-powered services endpoints',
    },
  ],
};

// Swagger options
const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  // Path to the API docs - using absolute path to ensure files are found
  apis: [path.resolve(__dirname, '../routes/*.ts')],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec; 