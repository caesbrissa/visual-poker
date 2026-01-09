"use client"

import * as React from "react"
import { Home, BarChart3, Calendar, TrendingUp, Settings, DollarSign, Target, Award } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

// Itens do menu principal
const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/",
    description: "Visão geral"
  },
  {
    title: "Estatísticas",
    icon: BarChart3,
    url: "#estatisticas",
    description: "Análises detalhadas"
  },
  {
    title: "Histórico",
    icon: Calendar,
    url: "#historico",
    description: "Sessões passadas"
  },
  {
    title: "Progresso",
    icon: TrendingUp,
    url: "#progresso",
    description: "Evolução temporal"
  },
]

// Itens secundários
const menuFinanceiro = [
  {
    title: "Bankroll",
    icon: DollarSign,
    url: "#bankroll",
  },
  {
    title: "Metas",
    icon: Target,
    url: "#metas",
  },
  {
    title: "Conquistas",
    icon: Award,
    url: "#conquistas",
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      {/* Cabeçalho do Menu */}
      <SidebarHeader style={{ padding: '20px', borderBottom: '1px solid var(--border-color, #1a1a1a)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            ♠️
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Poker Pro</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary, #666)', margin: 0 }}>Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel style={{ 
            fontSize: '11px', 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            color: '#666',
            padding: '20px 20px 10px 20px'
          }}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a 
                      href={item.url}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        textDecoration: 'none',
                        color: 'var(--text-primary, #fff)',
                        transition: 'all 0.2s',
                        borderRadius: '0'
                      }}
                    >
                      <item.icon style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{item.description}</div>
                      </div>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Financeiro */}
        <SidebarGroup>
          <SidebarGroupLabel style={{ 
            fontSize: '11px', 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            color: '#666',
            padding: '20px 20px 10px 20px'
          }}>
            Financeiro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuFinanceiro.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a 
                      href={item.url}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        textDecoration: 'none',
                        color: 'var(--text-primary, #fff)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <item.icon style={{ width: '18px', height: '18px', color: '#10b981' }} />
                      <span style={{ fontSize: '14px' }}>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Rodapé do Menu */}
      <SidebarFooter style={{ padding: '20px', borderTop: '1px solid var(--border-color, #1a1a1a)' }}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a 
                href="#configuracoes"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  textDecoration: 'none',
                  color: 'var(--text-primary, #fff)'
                }}
              >
                <Settings style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '14px' }}>Configurações</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}