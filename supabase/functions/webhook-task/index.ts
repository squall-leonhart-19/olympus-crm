// Olympus Webhook - Create Task from External Projects
// Deploy: supabase functions deploy webhook-task
// URL: https://YOUR_PROJECT.supabase.co/functions/v1/webhook-task

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Source to Project mapping - customize these
const SOURCE_PROJECT_MAP: Record<string, string> = {
    'accredipro': 'AccrediPro',
    'metrix': 'Metrix',
    'support': 'Support',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get webhook secret from environment
        const WEBHOOK_SECRET = Deno.env.get('OLYMPUS_WEBHOOK_SECRET') || 'olympus_webhook_secret_123'

        // Parse body
        const body = await req.json()

        // Validate secret
        if (body.secret !== WEBHOOK_SECRET) {
            return new Response(
                JSON.stringify({ error: 'Invalid webhook secret' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate required fields
        if (!body.title) {
            return new Response(
                JSON.stringify({ error: 'Title is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Map priority
        const priorityMap: Record<string, string> = {
            'low': 'low',
            'medium': 'medium',
            'high': 'high',
            'urgent': 'urgent'
        }

        // Auto-assign project based on source
        let projectId = body.projectId || null
        const source = body.source?.toLowerCase() || 'webhook'

        if (!projectId && source && SOURCE_PROJECT_MAP[source]) {
            const projectName = SOURCE_PROJECT_MAP[source]

            // Try to find or create the project
            let { data: project } = await supabase
                .from('projects')
                .select('id')
                .ilike('name', projectName)
                .single()

            if (!project) {
                // Create the project if it doesn't exist
                const icons: Record<string, string> = {
                    'accredipro': '🎓',
                    'metrix': '📊',
                    'support': '🎧',
                }
                const { data: newProject } = await supabase
                    .from('projects')
                    .insert({
                        name: projectName,
                        icon: icons[source] || '📁',
                        color: '#d4af37',
                        description: `Auto-created from ${source} webhook`
                    })
                    .select('id')
                    .single()

                if (newProject) projectId = newProject.id
            } else {
                projectId = project.id
            }
        }

        // Map department name to section_id (if provided)
        let sectionId = null
        if (body.department && projectId) {
            const { data: section } = await supabase
                .from('project_sections')
                .select('id')
                .eq('project_id', projectId)
                .ilike('name', body.department)
                .single()

            if (section) sectionId = section.id
        }

        // Validate assignee if provided
        let assigneeName = null
        if (body.assignee) {
            const { data: member } = await supabase
                .from('team_members')
                .select('name')
                .or(`name.ilike.${body.assignee},nickname.ilike.${body.assignee}`)
                .single()

            if (member) assigneeName = member.name
        }

        // Create the task
        const task = {
            title: body.title,
            description: body.description || '',
            status: 'todo',
            priority: priorityMap[body.priority?.toLowerCase()] || 'medium',
            due_date: body.dueDate || null,
            project_id: projectId,
            section_id: sectionId,
            source: source,
            assignee_name: assigneeName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert(task)
            .select()
            .single()

        if (error) {
            console.error('Insert error:', error)
            return new Response(
                JSON.stringify({ error: 'Failed to create task', details: error.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Task created successfully',
                task: {
                    id: data.id,
                    title: data.title,
                    status: data.status,
                    priority: data.priority,
                    projectId: data.project_id,
                    assignee: data.assignee_name,
                    source: data.source
                }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Webhook error:', err)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
