import React, { Component } from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
  errorInfo: any;
}

export class ProfileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error: any) { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error: any, errorInfo: any) { 
    this.setState({ errorInfo }); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 mt-24 border-2 border-rose-500 bg-rose-500/10 rounded-2xl text-white backdrop-blur-xl shadow-2xl">
          <h2 className="text-2xl font-black text-rose-500 mb-4">CRASH DETECTED!</h2>
          <p className="mb-4 text-sm text-slate-300 font-medium">Please screenshot this red box and send it to me so we can see exactly what is missing:</p>
          <div className="bg-black/80 p-4 rounded-xl text-xs font-mono text-rose-300 overflow-auto whitespace-pre-wrap border border-rose-500/30">
            {this.state.error && this.state.error.toString()}
          </div>
          <div className="bg-black/80 p-4 rounded-xl text-[10px] font-mono text-rose-400 mt-3 overflow-auto h-48 whitespace-pre-wrap border border-rose-500/30">
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
