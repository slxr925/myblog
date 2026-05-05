import React, { useEffect, useState } from 'react'
import { CheckCircle2, KeyRound, RefreshCw, Save, Settings2, XCircle } from 'lucide-react'
import { api } from '../../utils/api'
import type { OpenAiConfigUpdateDTO, OpenAiConfigVO } from '../../types/api'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { AdminNotice, AdminSectionCard, AdminStatCard } from './AdminUI'

type FormState = {
  aiEnabled: boolean
  apiKey: string
  clearApiKey: boolean
  baseUrl: string
  model: string
  completionsPath: string
  temperature: string
  maxTokensChat: string
  maxTokensTitle: string
  maxTokensSummary: string
  maxTokensKeywords: string
  maxTokensPolish: string
}

const createFormState = (config?: OpenAiConfigVO): FormState => ({
  aiEnabled: config?.aiEnabled ?? false,
  apiKey: '',
  clearApiKey: false,
  baseUrl: config?.baseUrl ?? 'https://api.openai.com',
  model: config?.model ?? 'gpt-4o-mini',
  completionsPath: config?.completionsPath ?? '/v1/chat/completions',
  temperature: String(config?.temperature ?? 0.7),
  maxTokensChat: String(config?.maxTokensChat ?? 700),
  maxTokensTitle: String(config?.maxTokensTitle ?? 80),
  maxTokensSummary: String(config?.maxTokensSummary ?? 260),
  maxTokensKeywords: String(config?.maxTokensKeywords ?? 120),
  maxTokensPolish: String(config?.maxTokensPolish ?? 1200),
})

export const OpenAiConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<OpenAiConfigVO | null>(null)
  const [form, setForm] = useState<FormState>(createFormState())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const loadConfig = async () => {
    setLoading(true)
    setNotice(null)
    try {
      const nextConfig = await api.admin.getOpenAiConfig()
      setConfig(nextConfig)
      setForm(createFormState(nextConfig))
    } catch (error) {
      console.error('获取OpenAI配置失败:', error)
      setNotice({ type: 'error', text: '获取 OpenAI 配置失败，请稍后重试。' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const temperature = Number(form.temperature)
      const payload: OpenAiConfigUpdateDTO = {
        aiEnabled: form.aiEnabled,
        apiKey: form.apiKey,
        clearApiKey: form.clearApiKey,
        baseUrl: form.baseUrl.trim(),
        model: form.model.trim(),
        completionsPath: form.completionsPath.trim(),
        temperature: Number.isFinite(temperature) ? temperature : 0.7,
        maxTokensChat: parsePositiveInt(form.maxTokensChat, 700),
        maxTokensTitle: parsePositiveInt(form.maxTokensTitle, 80),
        maxTokensSummary: parsePositiveInt(form.maxTokensSummary, 260),
        maxTokensKeywords: parsePositiveInt(form.maxTokensKeywords, 120),
        maxTokensPolish: parsePositiveInt(form.maxTokensPolish, 1200),
      }
      const updated = await api.admin.updateOpenAiConfig(payload)
      setConfig(updated)
      setForm(createFormState(updated))
      setNotice({ type: 'success', text: 'OpenAI 配置已保存，新的 AI 请求会立即使用当前配置。' })
    } catch (error) {
      console.error('更新OpenAI配置失败:', error)
      setNotice({ type: 'error', text: '保存失败，请检查配置内容和服务端日志。' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">正在加载 OpenAI 配置...</p>
        </div>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {notice && <AdminNotice type={notice.type}>{notice.text}</AdminNotice>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminStatCard
          label="运行状态"
          value={config?.available ? '可用' : '未就绪'}
          detail={config?.aiEnabled ? 'AI 功能已启用' : 'AI 功能已关闭'}
          icon={config?.available ? CheckCircle2 : XCircle}
        />
        <AdminStatCard
          label="API Key"
          value={config?.apiKeyConfigured ? '已配置' : '未配置'}
          detail={config?.apiKeyMasked || '保存新密钥后生效'}
          icon={KeyRound}
        />
        <AdminStatCard
          label=".env 文件"
          value={config?.envFileExists ? '已连接' : '将创建'}
          detail={config?.envFilePath || '-'}
          icon={Settings2}
        />
      </div>

      <AdminSectionCard
        title="OpenAI 配置"
        description="保存后写入服务端 .env 文件，并立即刷新运行期 ChatClient。"
        action={
          <Button type="button" variant="outline" size="sm" onClick={loadConfig} disabled={saving}>
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="openai-base-url">Base URL</Label>
            <Input
              id="openai-base-url"
              value={form.baseUrl}
              onChange={(event) => updateField('baseUrl', event.target.value)}
              placeholder="https://api.openai.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-model">模型</Label>
            <Input
              id="openai-model"
              value={form.model}
              onChange={(event) => updateField('model', event.target.value)}
              placeholder="gpt-4o-mini"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-path">Completions Path</Label>
            <Input
              id="openai-path"
              value={form.completionsPath}
              onChange={(event) => updateField('completionsPath', event.target.value)}
              placeholder="/v1/chat/completions"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-temperature">Temperature</Label>
            <Input
              id="openai-temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={form.temperature}
              onChange={(event) => updateField('temperature', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-max-chat">聊天输出上限</Label>
            <Input
              id="openai-max-chat"
              type="number"
              min="1"
              value={form.maxTokensChat}
              onChange={(event) => updateField('maxTokensChat', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-max-title">标题输出上限</Label>
            <Input
              id="openai-max-title"
              type="number"
              min="1"
              value={form.maxTokensTitle}
              onChange={(event) => updateField('maxTokensTitle', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-max-summary">摘要输出上限</Label>
            <Input
              id="openai-max-summary"
              type="number"
              min="1"
              value={form.maxTokensSummary}
              onChange={(event) => updateField('maxTokensSummary', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-max-keywords">关键词输出上限</Label>
            <Input
              id="openai-max-keywords"
              type="number"
              min="1"
              value={form.maxTokensKeywords}
              onChange={(event) => updateField('maxTokensKeywords', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-max-polish">润色输出上限</Label>
            <Input
              id="openai-max-polish"
              type="number"
              min="1"
              value={form.maxTokensPolish}
              onChange={(event) => updateField('maxTokensPolish', event.target.value)}
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="openai-api-key">API Key</Label>
            <Input
              id="openai-api-key"
              type="password"
              value={form.apiKey}
              disabled={form.clearApiKey}
              onChange={(event) => updateField('apiKey', event.target.value)}
              placeholder={config?.apiKeyConfigured ? `${config.apiKeyMasked}，留空则保留当前密钥` : '输入新的 API Key'}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-sm border border-border/70 bg-muted/18 p-4 sm:grid-cols-2">
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={form.aiEnabled}
              onCheckedChange={(checked) => updateField('aiEnabled', checked === true)}
            />
            启用 AI 功能
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={form.clearApiKey}
              onCheckedChange={(checked) => updateField('clearApiKey', checked === true)}
            />
            清空当前 API Key
          </label>
        </div>
      </AdminSectionCard>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={loadConfig} disabled={saving}>
          取消更改
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? '保存中...' : '保存配置'}
        </Button>
      </div>
    </form>
  )
}

const parsePositiveInt = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
