import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Mail, Lock, User, ArrowRight, LayoutTemplate } from "lucide-react";

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useApp();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません。もう一度お試しください。");
      return;
    }

    try {
      const success = await register(
        formData.username,
        formData.password,
        formData.email
      );
      if (success) {
        navigate("/");
      } else {
        setError("登録に失敗しました");
      }
    } catch (err: any) {
      setError("登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Branding & Visuals */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1629904853716-600abd17529c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 transform scale-105"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <LayoutTemplate className="w-8 h-8 text-primary-400" />
            <span className="text-2xl font-bold font-display">SlideQuick</span>
          </div>
          <h1 className="text-5xl font-bold font-display leading-tight mb-6">
            スマートなプレゼンテーションの<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              未来へ
            </span>
          </h1>
          <div className="grid grid-cols-2 gap-8 mt-12">
            <div>
              <h3 className="text-xl font-bold mb-2">自動フォーマット</h3>
              <p className="text-zinc-400">デザインは私たちに任せて、コンテンツに集中してください。</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">プロ用テンプレート</h3>
              <p className="text-zinc-400">あらゆる用途に対応する数百ものプレミアムテンプレートにアクセス。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Register Form */}
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">アカウントを作成</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="ユーザー名"
              name="username"
              type="text"
              placeholder="ユーザー名を選択"
              value={formData.username}
              onChange={handleChange}
              leftIcon={<User className="w-5 h-5" />}
              required
            />

            <Input
              label="メールアドレス"
              name="email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail className="w-5 h-5" />}
            />

            <Input
              label="パスワード"
              name="password"
              type="password"
              placeholder="パスワードを作成"
              value={formData.password}
              onChange={handleChange}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />

            <Input
              label="パスワード確認"
              name="confirmPassword"
              type="password"
              placeholder="パスワードを再入力"
              value={formData.confirmPassword}
              onChange={handleChange}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />

            {error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 animate-slide-up">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full justify-center"
              size="lg"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              始める
            </Button>
          </form>

          <div className="text-center text-sm text-slate-600">
            すでにアカウントをお持ちですか？{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              サインイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
