import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Mail, Lock, ArrowRight, LayoutTemplate } from "lucide-react";

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useApp();

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

    try {
      const success = await login(formData.username, formData.password);
      if (success) {
        // Check for redirect URL from query param
        const redirectUrl = searchParams.get('redirect');
        navigate(redirectUrl || "/");
      } else {
        setError("ユーザー名またはパスワードが無効です");
      }
    } catch (err: any) {
      setError("ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Branding & Visuals */}
      <div className="hidden lg:flex flex-col justify-between bg-primary-600 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <LayoutTemplate className="w-8 h-8" />
            <span className="text-2xl font-bold font-display">SlideQuick</span>
          </div>
          <h1 className="text-5xl font-bold font-display leading-tight mb-6">
            瞬時に素晴らしい<br />プレゼンテーションを作成
          </h1>
          <p className="text-primary-100 text-lg max-w-md">
            インテリジェントなスライド自動化プラットフォームで時間を節約しましょう
          </p>
        </div>

        <div className="relative z-10 flex gap-4 text-sm text-primary-100/60">
          <span>© 2024 SlideQuick</span>
          <span>プライバシーポリシー</span>
          <span>利用規約</span>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">おかえりなさい</h2>
            <p className="text-slate-500">
              サインインするには詳細を入力してください。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="ユーザー名"
              name="username"
              type="text"
              placeholder="ユーザー名を入力"
              value={formData.username}
              onChange={handleChange}
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />

            <div className="space-y-1">
              <Input
                label="パスワード"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  パスワードをお忘れですか？
                </Link>
              </div>
            </div>

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
              サインイン
            </Button>
          </form>

          <div className="text-center text-sm text-slate-600">
            アカウントをお持ちではありませんか？{" "}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              無料で登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
