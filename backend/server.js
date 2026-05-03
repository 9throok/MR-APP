require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const dcrRoutes = require('./routes/dcr');
const aiRoutes = require('./routes/ai');
const productRoutes = require('./routes/product');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const knowledgeRoutes = require('./routes/knowledge');
const adverseEventRoutes = require('./routes/adverse-events');
const doctorRoutes = require('./routes/doctors');
const doctorRequestRoutes = require('./routes/doctor-requests');
const rcpaRoutes = require('./routes/rcpa');
const salesRoutes = require('./routes/sales');
const targetRoutes = require('./routes/targets');
const tourPlanRoutes = require('./routes/tour-plans');
const expenseRoutes = require('./routes/expenses');
const leaveRoutes = require('./routes/leaves');
const orderRoutes = require('./routes/orders');
const sampleRoutes = require('./routes/samples');
const contentRoutes = require('./routes/content');
const mlrRoutes = require('./routes/mlr');
const contentViewRoutes = require('./routes/content-views');
const auditRoutes = require('./routes/audit');
const consentRoutes = require('./routes/consent');
const regulatoryDocsRoutes = require('./routes/regulatory-documents');
const complianceRoutes = require('./routes/compliance');
const institutionRoutes = require('./routes/institutions');
const affiliationRoutes = require('./routes/affiliations');
const specialtyRoutes = require('./routes/specialties');
const territoryAlignmentRoutes = require('./routes/territory-alignments');
const hcpRoutes = require('./routes/hcp');
const medicalQueriesRoutes = require('./routes/medical-queries');
const kolsRoutes = require('./routes/kols');
const medicalEngagementsRoutes = require('./routes/medical-engagements');
const pharmacyRoutes = require('./routes/pharmacies');
const distributorRoutes = require('./routes/distributors');
const usersRoutes = require('./routes/users');
const { authenticateToken } = require('./middleware/auth');
const { attachOrgScope } = require('./middleware/orgScope');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes — every authenticated request gets req.org_id attached
app.use('/api/dcr', authenticateToken, attachOrgScope, dcrRoutes);
app.use('/api/ai', authenticateToken, attachOrgScope, aiRoutes);
app.use('/api/products', authenticateToken, attachOrgScope, productRoutes);
app.use('/api/tasks', authenticateToken, attachOrgScope, taskRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/adverse-events', authenticateToken, attachOrgScope, adverseEventRoutes);
app.use('/api/doctors', authenticateToken, attachOrgScope, doctorRoutes);
app.use('/api/doctor-requests', authenticateToken, attachOrgScope, doctorRequestRoutes);
app.use('/api/rcpa', authenticateToken, attachOrgScope, rcpaRoutes);
app.use('/api/sales', authenticateToken, attachOrgScope, salesRoutes);
app.use('/api/targets', authenticateToken, attachOrgScope, targetRoutes);
app.use('/api/tour-plans', authenticateToken, attachOrgScope, tourPlanRoutes);
app.use('/api/expenses', authenticateToken, attachOrgScope, expenseRoutes);
app.use('/api/leaves', authenticateToken, attachOrgScope, leaveRoutes);
app.use('/api/orders', authenticateToken, attachOrgScope, orderRoutes);
app.use('/api/samples', authenticateToken, attachOrgScope, sampleRoutes);
app.use('/api/content', authenticateToken, attachOrgScope, contentRoutes);
app.use('/api/mlr', authenticateToken, attachOrgScope, mlrRoutes);
app.use('/api/content-views', authenticateToken, attachOrgScope, contentViewRoutes);
app.use('/api/audit', authenticateToken, attachOrgScope, auditRoutes);
app.use('/api/consent', authenticateToken, attachOrgScope, consentRoutes);
app.use('/api/regulatory-documents', authenticateToken, attachOrgScope, regulatoryDocsRoutes);
app.use('/api/compliance', authenticateToken, attachOrgScope, complianceRoutes);
app.use('/api/institutions', authenticateToken, attachOrgScope, institutionRoutes);
app.use('/api/affiliations', authenticateToken, attachOrgScope, affiliationRoutes);
app.use('/api/specialties', authenticateToken, attachOrgScope, specialtyRoutes);
app.use('/api/territory-alignments', authenticateToken, attachOrgScope, territoryAlignmentRoutes);
app.use('/api/hcp', authenticateToken, attachOrgScope, hcpRoutes);
app.use('/api/medical-queries', authenticateToken, attachOrgScope, medicalQueriesRoutes);
app.use('/api/kols', authenticateToken, attachOrgScope, kolsRoutes);
app.use('/api/medical-engagements', authenticateToken, attachOrgScope, medicalEngagementsRoutes);
app.use('/api/pharmacies', authenticateToken, attachOrgScope, pharmacyRoutes);
app.use('/api/distributors', authenticateToken, attachOrgScope, distributorRoutes);
app.use('/api/users', authenticateToken, attachOrgScope, usersRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
