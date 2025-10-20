import { NextResponse } from 'next/server';

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Ultimate Assistant Hub API',
    description: 'Complete productivity and personal management system API',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@ultimateassistant.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'https://api.ultimateassistant.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication token'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          image: { type: 'string', format: 'uri' },
          emailVerified: { type: 'string', format: 'date-time' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string' }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          },
          meta: {
            type: 'object',
            properties: {
              pagination: { $ref: '#/components/schemas/PaginationMeta' },
              timestamp: { type: 'string', format: 'date-time' },
              requestId: { type: 'string' }
            }
          }
        }
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          total: { type: 'integer', minimum: 0 },
          totalPages: { type: 'integer', minimum: 0 },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' }
        }
      },
      JournalEntry: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          title: { type: 'string', minLength: 1, maxLength: 200 },
          content: { type: 'string', minLength: 1, maxLength: 10000 },
          mood: {
            type: 'string',
            enum: ['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'calm', 'frustrated']
          },
          tags: {
            type: 'array',
            items: { type: 'string', maxLength: 50 },
            maxItems: 10
          },
          isPrivate: { type: 'boolean' },
          aiReflection: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          status: {
            type: 'string',
            enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            default: 'TODO'
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            default: 'MEDIUM'
          },
          dueDate: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time' },
          estimatedTime: { type: 'integer', minimum: 1, maximum: 480 },
          actualTime: { type: 'integer', minimum: 1, maximum: 480 },
          motionTaskId: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string', maxLength: 50 },
            maxItems: 10
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CalendarEvent: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          location: { type: 'string', maxLength: 200 },
          isAllDay: { type: 'boolean' },
          googleEventId: { type: 'string' },
          status: { type: 'string' },
          attendees: {
            type: 'array',
            items: { type: 'string', format: 'email' },
            maxItems: 50
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Email: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          messageId: { type: 'string' },
          threadId: { type: 'string' },
          subject: { type: 'string' },
          from: { type: 'string', format: 'email' },
          to: {
            type: 'array',
            items: { type: 'string', format: 'email' }
          },
          cc: {
            type: 'array',
            items: { type: 'string', format: 'email' }
          },
          content: { type: 'string' },
          isRead: { type: 'boolean' },
          isImportant: { type: 'boolean' },
          isDraft: { type: 'boolean' },
          attachments: {
            type: 'array',
            items: { type: 'string' }
          },
          labels: {
            type: 'array',
            items: { type: 'string' }
          },
          receivedAt: { type: 'string', format: 'date-time' },
          sentAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Contact: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          firstName: { type: 'string', maxLength: 100 },
          lastName: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', maxLength: 20 },
          company: { type: 'string', maxLength: 100 },
          jobTitle: { type: 'string', maxLength: 100 },
          notes: { type: 'string', maxLength: 2000 },
          tags: {
            type: 'array',
            items: { type: 'string', maxLength: 50 },
            maxItems: 10
          },
          googleContactId: { type: 'string' },
          isFavorite: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      DashboardMetrics: {
        type: 'object',
        properties: {
          tasksSummary: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              completed: { type: 'integer' },
              inProgress: { type: 'integer' },
              overdue: { type: 'integer' }
            }
          },
          journalSummary: {
            type: 'object',
            properties: {
              totalEntries: { type: 'integer' },
              thisWeek: { type: 'integer' },
              thisMonth: { type: 'integer' },
              averageMood: { type: 'number' }
            }
          },
          calendarSummary: {
            type: 'object',
            properties: {
              todayEvents: { type: 'integer' },
              upcomingEvents: { type: 'integer' },
              thisWeekEvents: { type: 'integer' }
            }
          },
          emailSummary: {
            type: 'object',
            properties: {
              unread: { type: 'integer' },
              total: { type: 'integer' },
              important: { type: 'integer' }
            }
          },
          contactsSummary: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              recent: { type: 'integer' },
              favorites: { type: 'integer' }
            }
          },
          productivityScore: { type: 'number' },
          weeklyActivity: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                tasks: { type: 'integer' },
                journal: { type: 'integer' },
                events: { type: 'integer' }
              }
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              requestId: { type: 'string' }
            }
          }
        }
      }
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        schema: { type: 'integer', minimum: 1, default: 1 }
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      },
      SortByParam: {
        name: 'sortBy',
        in: 'query',
        description: 'Field to sort by',
        schema: { type: 'string' }
      },
      SortOrderParam: {
        name: 'sortOrder',
        in: 'query',
        description: 'Sort order',
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
      },
      SearchParam: {
        name: 'search',
        in: 'query',
        description: 'Search term',
        schema: { type: 'string' }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user and return JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'User registration',
        description: 'Register new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'name', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string', minLength: 2, maxLength: 100 },
                  password: { type: 'string', minLength: 8, maxLength: 100 }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          },
          409: {
            description: 'User already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/dashboard/metrics': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard metrics',
        description: 'Retrieve comprehensive dashboard metrics and analytics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' }
        ],
        responses: {
          200: {
            description: 'Dashboard metrics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/DashboardMetrics' }
                      }
                    }
                  ]
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/journal': {
      get: {
        tags: ['Journal'],
        summary: 'Get journal entries',
        description: 'Retrieve paginated journal entries with filtering options',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/SortByParam' },
          { $ref: '#/components/parameters/SortOrderParam' },
          { $ref: '#/components/parameters/SearchParam' },
          {
            name: 'mood',
            in: 'query',
            description: 'Filter by mood',
            schema: {
              type: 'string',
              enum: ['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'calm', 'frustrated']
            }
          },
          {
            name: 'tags',
            in: 'query',
            description: 'Filter by tags (comma-separated)',
            schema: { type: 'string' }
          },
          {
            name: 'dateFrom',
            in: 'query',
            description: 'Filter by start date',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'dateTo',
            in: 'query',
            description: 'Filter by end date',
            schema: { type: 'string', format: 'date' }
          }
        ],
        responses: {
          200: {
            description: 'Journal entries retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/JournalEntry' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Journal'],
        summary: 'Create journal entry',
        description: 'Create a new journal entry',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', minLength: 1, maxLength: 200 },
                  content: { type: 'string', minLength: 1, maxLength: 10000 },
                  mood: {
                    type: 'string',
                    enum: ['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'calm', 'frustrated']
                  },
                  tags: {
                    type: 'array',
                    items: { type: 'string', maxLength: 50 },
                    maxItems: 10
                  },
                  isPrivate: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Journal entry created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/JournalEntry' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/journal/{id}': {
      get: {
        tags: ['Journal'],
        summary: 'Get journal entry by ID',
        description: 'Retrieve a specific journal entry',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Journal entry ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        responses: {
          200: {
            description: 'Journal entry retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/JournalEntry' }
                      }
                    }
                  ]
                }
              }
            }
          },
          404: {
            description: 'Journal entry not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Journal'],
        summary: 'Update journal entry',
        description: 'Update an existing journal entry',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Journal entry ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', minLength: 1, maxLength: 200 },
                  content: { type: 'string', minLength: 1, maxLength: 10000 },
                  mood: {
                    type: 'string',
                    enum: ['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'calm', 'frustrated']
                  },
                  tags: {
                    type: 'array',
                    items: { type: 'string', maxLength: 50 },
                    maxItems: 10
                  },
                  isPrivate: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Journal entry updated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/JournalEntry' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Journal'],
        summary: 'Delete journal entry',
        description: 'Delete a journal entry',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Journal entry ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        responses: {
          200: {
            description: 'Journal entry deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          }
        }
      }
    },
    '/journal/{id}/reflect': {
      post: {
        tags: ['Journal'],
        summary: 'Generate AI reflection for journal entry',
        description: 'Generate an AI-powered reflection for a journal entry',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Journal entry ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        responses: {
          200: {
            description: 'AI reflection generated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            reflection: { type: 'string' },
                            entry: { $ref: '#/components/schemas/JournalEntry' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Get tasks',
        description: 'Retrieve paginated tasks with filtering options',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/SortByParam' },
          { $ref: '#/components/parameters/SortOrderParam' },
          { $ref: '#/components/parameters/SearchParam' },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by status',
            schema: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
            }
          },
          {
            name: 'priority',
            in: 'query',
            description: 'Filter by priority',
            schema: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
            }
          },
          {
            name: 'dueDateFrom',
            in: 'query',
            description: 'Filter by due date from',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'dueDateTo',
            in: 'query',
            description: 'Filter by due date to',
            schema: { type: 'string', format: 'date' }
          }
        ],
        responses: {
          200: {
            description: 'Tasks retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Task' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create task',
        description: 'Create a new task with optional Motion.so sync',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', minLength: 1, maxLength: 200 },
                  description: { type: 'string', maxLength: 2000 },
                  priority: {
                    type: 'string',
                    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
                    default: 'MEDIUM'
                  },
                  dueDate: { type: 'string', format: 'date-time' },
                  estimatedTime: { type: 'integer', minimum: 1, maximum: 480 },
                  tags: {
                    type: 'array',
                    items: { type: 'string', maxLength: 50 },
                    maxItems: 10
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Task' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get task by ID',
        description: 'Retrieve a specific task',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Task ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        responses: {
          200: {
            description: 'Task retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Task' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update task',
        description: 'Update an existing task with Motion.so sync',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Task ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', minLength: 1, maxLength: 200 },
                  description: { type: 'string', maxLength: 2000 },
                  status: {
                    type: 'string',
                    enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
                  },
                  priority: {
                    type: 'string',
                    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
                  },
                  dueDate: { type: 'string', format: 'date-time' },
                  estimatedTime: { type: 'integer', minimum: 1, maximum: 480 },
                  actualTime: { type: 'integer', minimum: 1, maximum: 480 },
                  tags: {
                    type: 'array',
                    items: { type: 'string', maxLength: 50 },
                    maxItems: 10
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Task updated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Task' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete task',
        description: 'Delete a task with Motion.so sync',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Task ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        responses: {
          200: {
            description: 'Task deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          }
        }
      }
    },
    '/calendar': {
      get: {
        tags: ['Calendar'],
        summary: 'Get calendar events',
        description: 'Retrieve paginated calendar events with filtering options',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/SortByParam' },
          { $ref: '#/components/parameters/SortOrderParam' },
          { $ref: '#/components/parameters/SearchParam' },
          {
            name: 'dateFrom',
            in: 'query',
            description: 'Filter by start date',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'dateTo',
            in: 'query',
            description: 'Filter by end date',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by status',
            schema: { type: 'string' }
          },
          {
            name: 'location',
            in: 'query',
            description: 'Filter by location',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Calendar events retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/CalendarEvent' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Calendar'],
        summary: 'Create calendar event',
        description: 'Create a new calendar event with Google Calendar sync',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'startTime', 'endTime'],
                properties: {
                  title: { type: 'string', minLength: 1, maxLength: 200 },
                  description: { type: 'string', maxLength: 2000 },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                  location: { type: 'string', maxLength: 200 },
                  isAllDay: { type: 'boolean' },
                  attendees: {
                    type: 'array',
                    items: { type: 'string', format: 'email' },
                    maxItems: 50
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Calendar event created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/CalendarEvent' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/calendar/{id}': {
      get: {
        tags: ['Calendar'],
        summary: 'Get calendar event by ID',
        description: 'Retrieve a specific calendar event',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        responses: {
          200: {
            description: 'Calendar event retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/CalendarEvent' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Calendar'],
        summary: 'Update calendar event',
        description: 'Update an existing calendar event with Google Calendar sync',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', minLength: 1, maxLength: 200 },
                  description: { type: 'string', maxLength: 2000 },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                  location: { type: 'string', maxLength: 200 },
                  isAllDay: { type: 'boolean' },
                  status: { type: 'string' },
                  attendees: {
                    type: 'array',
                    items: { type: 'string', format: 'email' },
                    maxItems: 50
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Calendar event updated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/CalendarEvent' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Calendar'],
        summary: 'Delete calendar event',
        description: 'Delete a calendar event with Google Calendar sync',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Event ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        responses: {
          200: {
            description: 'Calendar event deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          }
        }
      }
    },
    '/emails': {
      get: {
        tags: ['Email'],
        summary: 'Get emails',
        description: 'Retrieve paginated emails with filtering options',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/SortByParam' },
          { $ref: '#/components/parameters/SortOrderParam' },
          { $ref: '#/components/parameters/SearchParam' },
          {
            name: 'isRead',
            in: 'query',
            description: 'Filter by read status',
            schema: { type: 'boolean' }
          },
          {
            name: 'isImportant',
            in: 'query',
            description: 'Filter by importance',
            schema: { type: 'boolean' }
          },
          {
            name: 'from',
            in: 'query',
            description: 'Filter by sender',
            schema: { type: 'string' }
          },
          {
            name: 'dateFrom',
            in: 'query',
            description: 'Filter by start date',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'dateTo',
            in: 'query',
            description: 'Filter by end date',
            schema: { type: 'string', format: 'date' }
          }
        ],
        responses: {
          200: {
            description: 'Emails retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Email' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/emails/send': {
      post: {
        tags: ['Email'],
        summary: 'Send email',
        description: 'Send an email via SMTP or Gmail API',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to', 'subject', 'content'],
                properties: {
                  to: {
                    type: 'array',
                    items: { type: 'string', format: 'email' },
                    minItems: 1,
                    maxItems: 50
                  },
                  cc: {
                    type: 'array',
                    items: { type: 'string', format: 'email' },
                    maxItems: 50
                  },
                  bcc: {
                    type: 'array',
                    items: { type: 'string', format: 'email' },
                    maxItems: 50
                  },
                  subject: { type: 'string', minLength: 1, maxLength: 200 },
                  content: { type: 'string', minLength: 1, maxLength: 10000 },
                  htmlContent: { type: 'string', maxLength: 50000 },
                  attachments: {
                    type: 'array',
                    items: { type: 'string' },
                    maxItems: 10
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Email sent successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            subject: { type: 'string' },
                            from: { type: 'string' },
                            to: {
                              type: 'array',
                              items: { type: 'string' }
                            },
                            status: { type: 'string' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/emails/sync': {
      post: {
        tags: ['Email'],
        summary: 'Sync emails from Gmail',
        description: 'Sync emails from Gmail account',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Emails synced successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            synced: { type: 'integer' },
                            updated: { type: 'integer' },
                            errors: {
                              type: 'array',
                              items: { type: 'string' }
                            },
                            lastSync: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/contacts': {
      get: {
        tags: ['Contacts'],
        summary: 'Get contacts',
        description: 'Retrieve paginated contacts with filtering options',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/SortByParam' },
          { $ref: '#/components/parameters/SortOrderParam' },
          { $ref: '#/components/parameters/SearchParam' },
          {
            name: 'company',
            in: 'query',
            description: 'Filter by company',
            schema: { type: 'string' }
          },
          {
            name: 'isFavorite',
            in: 'query',
            description: 'Filter by favorite status',
            schema: { type: 'boolean' }
          }
        ],
        responses: {
          200: {
            description: 'Contacts retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Contact' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Contacts'],
        summary: 'Create contact',
        description: 'Create a new contact with Google Contacts sync',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', maxLength: 100 },
                  lastName: { type: 'string', maxLength: 100 },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string', maxLength: 20 },
                  company: { type: 'string', maxLength: 100 },
                  jobTitle: { type: 'string', maxLength: 100 },
                  notes: { type: 'string', maxLength: 2000 },
                  tags: {
                    type: 'array',
                    items: { type: 'string', maxLength: 50 },
                    maxItems: 10
                  },
                  isFavorite: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Contact created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Contact' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/contacts/{id}': {
      get: {
        tags: ['Contacts'],
        summary: 'Get contact by ID',
        description: 'Retrieve a specific contact',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Contact ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        responses: {
          200: {
            description: 'Contact retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Contact' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Contacts'],
        summary: 'Update contact',
        description: 'Update an existing contact with Google Contacts sync',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Contact ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', maxLength: 100 },
                  lastName: { type: 'string', maxLength: 100 },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string', maxLength: 20 },
                  company: { type: 'string', maxLength: 100 },
                  jobTitle: { type: 'string', maxLength: 100 },
                  notes: { type: 'string', maxLength: 2000 },
                  tags: {
                    type: 'array',
                    items: { type: 'string', maxLength: 50 },
                    maxItems: 10
                  },
                  isFavorite: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Contact updated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Contact' }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Contacts'],
        summary: 'Delete contact',
        description: 'Delete a contact with Google Contacts sync',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Contact ID',
            schema: { type: 'string', format: 'cuid' }
          }
        ],
        responses: {
          200: {
            description: 'Contact deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          }
        }
      }
    },
    '/analytics/metrics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics metrics',
        description: 'Retrieve detailed analytics metrics across all modules',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'metricTypes',
            in: 'query',
            description: 'Types of metrics to retrieve',
            schema: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['tasks_completed', 'journal_entries', 'calendar_events', 'emails_processed', 'contacts_added']
              }
            }
          },
          {
            name: 'dateFrom',
            in: 'query',
            description: 'Start date for metrics',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'dateTo',
            in: 'query',
            description: 'End date for metrics',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'granularity',
            in: 'query',
            description: 'Time granularity for metrics',
            schema: {
              type: 'string',
              enum: ['day', 'week', 'month'],
              default: 'day'
            }
          }
        ],
        responses: {
          200: {
            description: 'Analytics metrics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            overview: { type: 'object' },
                            trends: { type: 'object' },
                            insights: {
                              type: 'array',
                              items: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/analytics/insights': {
      get: {
        tags: ['Analytics'],
        summary: 'Get productivity insights',
        description: 'Retrieve AI-powered productivity insights and recommendations',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Productivity insights retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            overallScore: { type: 'number' },
                            trends: { type: 'object' },
                            recommendations: {
                              type: 'array',
                              items: { type: 'string' }
                            },
                            achievements: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  type: { type: 'string' },
                                  description: { type: 'string' },
                                  achievedAt: { type: 'string', format: 'date-time' }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Global search',
        description: 'Search across all modules (journal, tasks, calendar, emails, contacts)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'query',
            in: 'query',
            required: true,
            description: 'Search query',
            schema: { type: 'string', minLength: 1, maxLength: 200 }
          },
          {
            name: 'types',
            in: 'query',
            description: 'Modules to search in',
            schema: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['journal', 'tasks', 'calendar', 'emails', 'contacts']
              }
            }
          },
          {
            name: 'dateFrom',
            in: 'query',
            description: 'Filter by start date',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'dateTo',
            in: 'query',
            description: 'Filter by end date',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 }
          }
        ],
        responses: {
          200: {
            description: 'Search results retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            query: { type: 'string' },
                            total: { type: 'integer' },
                            results: { type: 'object' },
                            summary: { type: 'object' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Dashboard',
      description: 'Dashboard metrics and analytics'
    },
    {
      name: 'Journal',
      description: 'Personal journal entries with AI reflections'
    },
    {
      name: 'Tasks',
      description: 'Task management with Motion.so integration'
    },
    {
      name: 'Calendar',
      description: 'Calendar events with Google Calendar integration'
    },
    {
      name: 'Email',
      description: 'Email management with Gmail integration'
    },
    {
      name: 'Contacts',
      description: 'Contact management with Google Contacts integration'
    },
    {
      name: 'Analytics',
      description: 'Productivity analytics and insights'
    },
    {
      name: 'Search',
      description: 'Global search across all modules'
    }
  ]
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}