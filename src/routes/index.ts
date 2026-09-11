import { Router } from 'express';
import authRoutes from './auth.routes.js';
import serviceRequestRoutes from './service-request.routes.js';
import coaRoutes from './coa.routes.js';
import decisionSupportRoutes from './decision-support.routes.js';
import complaintRoutes from './complaint.routes.js';
import geminiRoutes from './gemini.routes.js';
import notificationRoutes from './notification.routes.js';
import issueRoutes from './issue.routes.js';
import workerRoutes from './worker.routes.js';
import trainRoutes from './train.routes.js';
import supervisorRoutes from './supervisor.routes.js';
import departmentRoutes from './department.routes.js';

const router = Router();

// Health Check
const healthHandler = (_req: any, res: any) => {
  res.json({
    status: 'healthy',
    service: 'RailPravah Backend API',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
};
router.get('/health', healthHandler);
router.get('/api/health', healthHandler);

// Mounted Sub-routers
router.use('/auth', authRoutes);
router.use('/service-requests', serviceRequestRoutes);
router.use('/coa', coaRoutes);
router.use('/complaints', complaintRoutes);
router.use('/issues', issueRoutes);
router.use('/notifications', notificationRoutes);
router.use('/gemini', geminiRoutes);
router.use('/ai', geminiRoutes);
router.use('/worker', workerRoutes);
router.use('/trains', trainRoutes);
router.use('/supervisor', supervisorRoutes);
router.use('/department', departmentRoutes);

// Direct /api/* aliases when mounted at root '/'
router.use('/api/auth', authRoutes);
router.use('/api/service-requests', serviceRequestRoutes);
router.use('/api/coa', coaRoutes);
router.use('/api/complaints', complaintRoutes);
router.use('/api/issues', issueRoutes);
router.use('/api/notifications', notificationRoutes);
router.use('/api/gemini', geminiRoutes);
router.use('/api/ai', geminiRoutes);
router.use('/api/worker', workerRoutes);
router.use('/api/trains', trainRoutes);
router.use('/api/supervisor', supervisorRoutes);
router.use('/api/department', departmentRoutes);

// Decision support & conflict routes
router.use('/', decisionSupportRoutes); // mounts /stats/tracks and /blocks/:id/conflicts
router.use('/api', decisionSupportRoutes);

export default router;
