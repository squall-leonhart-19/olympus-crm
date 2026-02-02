# Olympus Webhook API

## Create Task from External Projects

**Endpoint:** `POST /functions/v1/webhook-task`

**Full URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/webhook-task`

---

## Request Body

```json
{
  "secret": "olympus_webhook_secret_123",
  "title": "Follow up: Dispute for Order #8821",
  "description": "User filed chargeback, need to prepare evidence",
  "priority": "urgent",
  "department": "Customer Care",
  "source": "accredipro",
  "assignee": "Marco",
  "dueDate": "2026-02-02"
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `secret` | ✅ Yes | Webhook authentication secret |
| `title` | ✅ Yes | Task title |
| `description` | No | Task details |
| `priority` | No | `low`, `medium`, `high`, `urgent` (default: medium) |
| `department` | No | Maps to department within project |
| `source` | No | Auto-creates/assigns project (`accredipro`→AccrediPro, `metrix`→Metrix) |
| `assignee` | No | Assigns to team member by name or nickname |
| `dueDate` | No | Due date in ISO format (YYYY-MM-DD) |

---

## Auto Project Assignment

When you send a `source`, the webhook automatically:
1. Finds or creates a project with that name
2. Assigns the task to that project
3. Shows tasks filtered by that project in Olympus

| Source | Auto-Creates Project |
|--------|---------------------|
| `accredipro` | 🎓 AccrediPro |
| `metrix` | 📊 Metrix |
| `support` | 🎧 Support |

---

## Example: cURL

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/webhook-task \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "olympus_webhook_secret_123",
    "title": "Scale Healthcare Workers ad set",
    "priority": "high",
    "department": "Meta Ads",
    "source": "metrix",
    "assignee": "Marco"
  }'
```

---

## Example: JavaScript (From Metrix/AccrediPro)

```javascript
async function sendTaskToOlympus(taskData) {
  const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/webhook-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.OLYMPUS_WEBHOOK_SECRET,
      ...taskData
    })
  })
  
  return response.json()
}

// Usage - task auto-assigned to AccrediPro project
await sendTaskToOlympus({
  title: 'Handle dispute #1234',
  priority: 'urgent',
  department: 'Customer Care',
  source: 'accredipro',
  assignee: 'Marco',
  dueDate: '2026-02-02'
})
```

---

## Response

### Success (200)
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "id": "abc123",
    "title": "Handle dispute #1234",
    "status": "todo",
    "priority": "urgent",
    "projectId": "project_123",
    "assignee": "Marco",
    "source": "accredipro"
  }
}
```

### Error (401 - Invalid Secret)
```json
{
  "error": "Invalid webhook secret"
}
```

---

## Deployment

1. Set environment variable:
```bash
supabase secrets set OLYMPUS_WEBHOOK_SECRET=your_secure_secret_here
```

2. Deploy the function:
```bash
supabase functions deploy webhook-task
```

---

## Integration Examples

### From Metrix (Ad Performance Alert)
```javascript
if (adSet.cpl < 5 && adSet.roas > 3) {
  await sendTaskToOlympus({
    title: `Scale ${adSet.name} - CPL $${adSet.cpl}`,
    description: `ROAS ${adSet.roas}x, ready to scale 20%`,
    priority: 'high',
    source: 'metrix',  // → Auto-assigns to Metrix project
    assignee: 'Marco'
  })
}
```

### From AccrediPro (Dispute Filed)
```javascript
await sendTaskToOlympus({
  title: `URGENT: Dispute filed - Order #${order.id}`,
  description: `User: ${user.email}\nAmount: $${order.amount}`,
  priority: 'urgent',
  department: 'Customer Care',
  source: 'accredipro',  // → Auto-assigns to AccrediPro project
  assignee: 'Sarah',
  dueDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]
})
```
