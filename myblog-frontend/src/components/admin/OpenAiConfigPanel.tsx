import React, { useEffect, useState } from 'react'
import { CheckCircle2, Database, KeyRound, RefreshCw, Save, Settings2, XCircle } from 'lucide-react'
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
  ragEnabled: boolean
  ragTopK: string
  ragSimilarityThreshold: string
  embeddingEnabled: boolean
  embeddingBaseUrl: string
  embeddingPath: string
  embeddingModel: string
  embeddingApiKey: string
  clearEmbeddingApiKey: boolean
  embeddingDimensions: string
}

const createFormState = (config?: OpenAiConfigVO): FormState => ({
  aiEnabled: config?.aiEnabled ?? false,
  apiKey: '',
  clearApiKey: false,
  baseUrl: config?.baseUrl ?? 'https://api.deepseek.com',
  model: config?.model ?? 'deepseek-v4-flash',
  completionsPath: config?.completionsPath ?? '/chat/completions',
  temperature: String(config?.temperature ?? 0.7),
  maxTokensChat: String(config?.maxTokensChat ?? 700),
  maxTokensTitle: String(config?.maxTokensTitle ?? 80),
  maxTokensSummary: String(config?.maxTokensSummary ?? 260),
  maxTokensKeywords: String(config?.maxTokensKeywords ?? 120),
  maxTokensPolish: String(config?.maxTokensPolish ?? 1200),
  ragEnabled: config?.ragEnabled ?? false,
  ragTopK: String(config?.ragTopK ?? 5),
  ragSimilarityThreshold: String(config?.ragSimilarityThreshold ?? 0.6),
  embeddingEnabled: config?.embeddingEnabled ?? false,
  embeddingBaseUrl: config?.embeddingBaseUrl ?? 'https://api.siliconflow.cn',
  embeddingPath: config?.embeddingPath ?? '/v1/embeddings',
  embeddingModel: config?.embeddingModel ?? 'BAAI/bge-m3',
  embeddingApiKey: '',
  clearEmbeddingApiKey: false,
  embeddingDimensions: String(config?.embeddingDimensions ?? 1024),
})

export const OpenAiConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<OpenAiConfigVO | null>(null)
  const [form, setForm] = useState<FormState>(createFormState())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
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
        ragEnabled: form.ragEnabled,
        ragTopK: parsePositiveInt(form.ragTopK, 5),
        ragSimilarityThreshold: parseBoundedNumber(form.ragSimilarityThreshold, 0.6, 0, 1),
        embeddingEnabled: form.embeddingEnabled,
        embeddingBaseUrl: form.embeddingBaseUrl.trim(),
        embeddingPath: form.embeddingPath.trim(),
        embeddingModel: form.embeddingModel.trim(),
        embeddingApiKey: form.embeddingApiKey,
        clearEmbeddingApiKey: form.clearEmbeddingApiKey,
        embeddingDimensions: parsePositiveInt(form.embeddingDimensions, 1024),
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

  const handleRebuildRag = async () => {
    setRebuilding(true)
    setNotice(null)
    try {
      await api.admin.rebuildRagIndex()
      const nextConfig = await api.admin.getOpenAiConfig()
      setConfig(nextConfig)
      setForm(createFormState(nextConfig))
      setNotice({ type: 'success', text: 'RAG 索引重建任务已提交，请稍后刷新查看 chunk 数。' })
    } catch (error) {
      console.error('触发RAG索引重建失败:', error)
      setNotice({ type: 'error', text: '触发 RAG 索引重建失败，请检查 Embedding 配置和服务端日志。' })
    } finally {
      setRebuilding(false)
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminStatCard
          label="RAG 状态"
          value={config?.ragAvailable ? '可用' : '未就绪'}
          detail={config?.ragEnabled ? '检索增强已启用' : '检索增强已关闭'}
          icon={config?.ragAvailable ? CheckCircle2 : XCircle}
        />
        <AdminStatCard
          label="Embedding"
          value={config?.embeddingAvailable ? '可用' : '未就绪'}
          detail={config?.embeddingApiKeyConfigured ? config.embeddingApiKeyMasked : '保存密钥后生效'}
          icon={KeyRound}
        />
        <AdminStatCard
          label="向量索引"
          value={config?.ragChunkCount != null ? `${config.ragChunkCount}` : '0'}
          detail={config?.ragRebuilding ? '正在重建' : (config?.ragIndexName || 'blog_rag_chunks')}
          icon={Database}
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
              placeholder="https://api.deepseek.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-model">模型</Label>
            <Input
              id="openai-model"
              value={form.model}
              onChange={(event) => updateField('model', event.target.value)}
              placeholder="deepseek-v4-flash"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-path">Completions Path</Label>
            <Input
              id="openai-path"
              value={form.completionsPath}
              onChange={(event) => updateField('completionsPath', event.target.value)}
              placeholder="/chat/completions"
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

      <AdminSectionCard
        title="RAG / Embedding 配置"
        description="Embedding 使用独立配置，不复用聊天模型；保存后新的检索和重建任务会使用当前配置。"
        action={
          <Button type="button" variant="outline" size="sm" onClick={handleRebuildRag} disabled={saving || rebuilding}>
            <Database className="h-4 w-4" />
            {rebuilding ? '提交中...' : '重建索引'}
          </Button>
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="embedding-base-url">Embedding Base URL</Label>
            <Input
              id="embedding-base-url"
              value={form.embeddingBaseUrl}
              onChange={(event) => updateField('embeddingBaseUrl', event.target.value)}
              placeholder="https://api.siliconflow.cn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="embedding-path">Embedding Path</Label>
            <Input
              id="embedding-path"
              value={form.embeddingPath}
              onChange={(event) => updateField('embeddingPath', event.target.value)}
              placeholder="/v1/embeddings"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="embedding-model">向量模型</Label>
            <Input
              id="embedding-model"
              value={form.embeddingModel}
              onChange={(event) => updateField('embeddingModel', event.target.value)}
              placeholder="BAAI/bge-m3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="embedding-dimensions">向量维度</Label>
            <Input
              id="embedding-dimensions"
              type="number"
              min="1"
              value={form.embeddingDimensions}
              onChange={(event) => updateField('embeddingDimensions', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rag-top-k">RAG Top K</Label>
            <Input
              id="rag-top-k"
              type="number"
              min="1"
              value={form.ragTopK}
              onChange={(event) => updateField('ragTopK', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rag-similarity-threshold">相似度阈值</Label>
            <Input
              id="rag-similarity-threshold"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={form.ragSimilarityThreshold}
              onChange={(event) => updateField('ragSimilarityThreshold', event.target.value)}
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="embedding-api-key">Embedding API Key</Label>
            <Input
              id="embedding-api-key"
              type="password"
              value={form.embeddingApiKey}
              disabled={form.clearEmbeddingApiKey}
              onChange={(event) => updateField('embeddingApiKey', event.target.value)}
              placeholder={config?.embeddingApiKeyConfigured ? `${config.embeddingApiKeyMasked}，留空则保留当前密钥` : '输入 SiliconFlow API Key'}
            />
          </div>
        </div>
        <div className="mt-5 grid gap-3 rounded-sm border border-border/70 bg-muted/18 p-4 sm:grid-cols-3">
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={form.ragEnabled}
              onCheckedChange={(checked) => updateField('ragEnabled', checked === true)}
            />
            启用 RAG
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={form.embeddingEnabled}
              onCheckedChange={(checked) => updateField('embeddingEnabled', checked === true)}
            />
            启用 Embedding
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={form.clearEmbeddingApiKey}
              onCheckedChange={(checked) => updateField('clearEmbeddingApiKey', checked === true)}
            />
            清空 Embedding Key
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

const parseBoundedNumber = (value: string, fallback: number, min: number, max: number) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback
}
