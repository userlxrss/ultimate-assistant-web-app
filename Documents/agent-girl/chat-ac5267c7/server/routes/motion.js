const express = require('express');
const axios = require('axios');
const router = express.Router();

// Motion API configuration
const MOTION_API_BASE_URL = 'https://api.usemotion.com/v1';

// Middleware to check Motion authentication
const requireMotionAuth = (req, res, next) => {
  if (!req.session.motionApiKey) {
    return res.status(401).json({
      error: 'Motion not authenticated',
      message: 'Please connect your Motion account first'
    });
  }
  next();
};

// Apply authentication middleware to all routes
router.use(requireMotionAuth);

// Helper function to make authenticated Motion API requests
const makeMotionRequest = async (apiKey, endpoint, options = {}) => {
  const url = `${MOTION_API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await axios(url, config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Motion API error: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Motion API network error');
    } else {
      throw new Error(`Motion API request error: ${error.message}`);
    }
  }
};

// Test Motion connection
router.get('/test', async (req, res) => {
  try {
    // Test with a simple API call
    const response = await makeMotionRequest(req.session.motionApiKey,req.session.motionApiKey, '/tasks', {
      params: { limit: 1 }
    });

    res.json({
      connected: true,
      service: 'Motion',
      message: 'Motion API connection successful',
      sampleData: {
        tasksFound: response.tasks?.length || 0
      }
    });
  } catch (error) {
    console.error('Motion test error:', error);
    res.status(500).json({
      connected: false,
      error: 'Motion connection failed',
      message: error.message
    });
  }
});

// Tasks endpoints
router.get('/tasks', async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      status,
      projectId,
      assigneeId,
      dueDate,
      sort = 'createdAt'
    } = req.query;

    const params = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort
    };

    if (status) params.status = status;
    if (projectId) params.projectId = projectId;
    if (assigneeId) params.assigneeId = assigneeId;
    if (dueDate) params.dueDate = dueDate;

    const response = await makeMotionRequest(req.session.motionApiKey,'/tasks', { params });

    res.json({
      tasks: response.tasks || [],
      total: response.total || 0,
      hasMore: response.hasMore || false
    });
  } catch (error) {
    console.error('Motion tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch Motion tasks' });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const taskData = req.body;

    const response = await makeMotionRequest(req.session.motionApiKey,'/tasks', {
      method: 'POST',
      data: taskData
    });

    res.json(response);
  } catch (error) {
    console.error('Motion create task error:', error);
    res.status(500).json({ error: 'Failed to create Motion task' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const taskData = req.body;

    const response = await makeMotionRequest(req.session.motionApiKey,`/tasks/${id}`, {
      method: 'PUT',
      data: taskData
    });

    res.json(response);
  } catch (error) {
    console.error('Motion update task error:', error);
    res.status(500).json({ error: 'Failed to update Motion task' });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await makeMotionRequest(req.session.motionApiKey,`/tasks/${id}`, {
      method: 'DELETE'
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Motion delete task error:', error);
    res.status(500).json({ error: 'Failed to delete Motion task' });
  }
});

// Projects endpoints
router.get('/projects', async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      status,
      sort = 'createdAt'
    } = req.query;

    const params = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort
    };

    if (status) params.status = status;

    const response = await makeMotionRequest(req.session.motionApiKey,'/projects', { params });

    res.json({
      projects: response.projects || [],
      total: response.total || 0,
      hasMore: response.hasMore || false
    });
  } catch (error) {
    console.error('Motion projects error:', error);
    res.status(500).json({ error: 'Failed to fetch Motion projects' });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const projectData = req.body;

    const response = await makeMotionRequest(req.session.motionApiKey,'/projects', {
      method: 'POST',
      data: projectData
    });

    res.json(response);
  } catch (error) {
    console.error('Motion create project error:', error);
    res.status(500).json({ error: 'Failed to create Motion project' });
  }
});

// Users endpoints
router.get('/users', async (req, res) => {
  try {
    const response = await makeMotionRequest(req.session.motionApiKey,'/users');

    res.json({
      users: response.users || []
    });
  } catch (error) {
    console.error('Motion users error:', error);
    res.status(500).json({ error: 'Failed to fetch Motion users' });
  }
});

// Workspace endpoint
router.get('/workspace', async (req, res) => {
  try {
    const response = await makeMotionRequest(req.session.motionApiKey,'/workspace');

    res.json(response);
  } catch (error) {
    console.error('Motion workspace error:', error);
    res.status(500).json({ error: 'Failed to fetch Motion workspace' });
  }
});

// Sync status endpoint
router.get('/sync/status', async (req, res) => {
  try {
    // Get counts from different endpoints
    const [tasksResponse, projectsResponse, workspaceResponse] = await Promise.allSettled([
      makeMotionRequest(req.session.motionApiKey,'/tasks', { params: { limit: 1 } }),
      makeMotionRequest(req.session.motionApiKey,'/projects', { params: { limit: 1 } }),
      makeMotionRequest(req.session.motionApiKey,'/workspace')
    ]);

    const tasksTotal = tasksResponse.status === 'fulfilled' ? tasksResponse.value.total || 0 : 0;
    const projectsTotal = projectsResponse.status === 'fulfilled' ? projectsResponse.value.total || 0 : 0;
    const workspace = workspaceResponse.status === 'fulfilled' ? workspaceResponse.value : null;

    res.json({
      connected: true,
      lastSync: new Date().toISOString(),
      workspace: workspace ? {
        name: workspace.name,
        id: workspace.id
      } : null,
      stats: {
        tasks: tasksTotal,
        projects: projectsTotal
      },
      status: {
        tasks: tasksResponse.status === 'fulfilled' ? 'connected' : 'error',
        projects: projectsResponse.status === 'fulfilled' ? 'connected' : 'error',
        workspace: workspaceResponse.status === 'fulfilled' ? 'connected' : 'error'
      }
    });
  } catch (error) {
    console.error('Motion sync status error:', error);
    res.status(500).json({
      connected: false,
      error: 'Failed to fetch Motion sync status',
      message: error.message
    });
  }
});

module.exports = router;