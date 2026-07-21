/// <reference types="vite/client" />
/** 🅵 Task 2: Global ErrorBoundary — 拦截 DataHub / SupplierPage 渲染崩溃。 */

import React, { Component, type ReactNode } from 'react';
import { Alert, Button } from 'antd';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Alert
            type="error"
            showIcon
            message="模块运行异常"
            description={
              <>
                <p style={{ color: '#888', marginBottom: 16 }}>
                  系统检测到该模块发生异常，请刷新页面或联系管理员。
                </p>
                <p style={{ fontSize: 12, color: '#ccc', marginBottom: 16 }}>
                  {this.state.error?.message}
                </p>
                <Button type="primary" onClick={this.handleReset}>
                  重试
                </Button>
              </>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
