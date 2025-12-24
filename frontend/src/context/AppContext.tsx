import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Project, Slide, User } from "../types";
import { generateLayoutElements } from "../utils/layoutUtils";
import { SYSTEM_TEMPLATES } from "../utils/projectTemplates";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface AppContextType {
  projects: Project[];
  sharedProjects: Project[];
  currentProject: Project | null;
  currentSlideIndex: number;
  loading: boolean;
  currentUser: User | null;
  createProject: (
    name: string,
    description?: string,
    lessonName?: string,
    basicInfo?: string,
    initialStyle?: { backgroundColor: string; textColor: string; accentColor: string; fontFamily: string; },
    templateId?: string
  ) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  updateProject: (project: Project) => Promise<void>;
  addSlide: (projectId: string, template: Slide["template"]) => Promise<void>;
  updateSlide: (
    projectId: string,
    slideId: string,
    updates: Partial<Slide>
  ) => Promise<void>;
  deleteSlide: (projectId: string, slideId: string) => Promise<void>;
  duplicateSlide: (projectId: string, slideId: string) => Promise<void>;
  setCurrentSlideIndex: (index: number) => void;
  refreshProjects: (overrideToken?: string, silent?: boolean) => Promise<void>;
  fetchSharedProjects: () => Promise<void>;
  markProjectAccessed: (projectId: string) => Promise<void>;
  // auth
  login: (username: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    password: string,
    email?: string
  ) => Promise<boolean>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // helper to build headers (allow token override for immediate use after login/register)
  const getHeaders = (overrideToken?: string) => {
    // Fallback to localStorage if state token not yet set (e.g., during initial load)
    const t = overrideToken ?? token ?? localStorage.getItem("sq_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (t) headers["Authorization"] = `Bearer ${t}`;
    return headers;
  };

  // プロジェクトをAPIから読み込む
  // accept overrideToken so we can call right after login/register
  const refreshProjects = async (overrideToken?: string, silent: boolean = false) => {
    try {
      // If we don't have a token (and no override), we are likely a guest.
      // Don't attempt to fetch from API to avoid 401 and state wipe.
      const currentToken = overrideToken ?? token ?? localStorage.getItem("sq_token");
      if (!currentToken) {
        // Guest mode: just clear projects list but DON'T wipe currentProject 
        // because it might be populated by Editor.tsx (shared session)
        setProjects([]);
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);
      const response = await fetch(`${API_URL}/projects`, {
        headers: getHeaders(overrideToken),
      });

      // If token invalid/expired, clear auth and stop
      if (response.status === 401) {
        // clear local auth state
        setCurrentUser(null);
        setToken(null);
        setProjects([]);
        // Do NOT wipe currentProject here blindly, as it might be a shared session.
        // Only wipe if we were expecting to be logged in.
        // Actually, if 401 happens, it means our token is bad.
        // But if we are in Editor viewing a shared Link, we don't want to receive this error.
        // The check above (!currentToken) should prevent us reaching here if we are purely guest.
        // If we HAD a token but it expired, we fall here. 
        // In that case, we should probably let it wipe to be safe? 
        // BUT, if I am viewing a shared link with an expired token, I should probably just be downgraded to guest 
        // and keep viewing the shared link.

        // For now, let's keep the wipe but reliance on the check above is key.
        setCurrentProject(null);
        setCurrentSlideIndex(0);
        localStorage.removeItem("sq_user");
        localStorage.removeItem("sq_token");
        throw new Error("Unauthorized");
      }

      if (!response.ok) throw new Error("プロジェクトの取得に失敗しました");

      const data = await response.json();
      const parsedProjects = data.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));

      setProjects(parsedProjects);
    } catch (error) {
      console.error("プロジェクトの読み込みエラー:", error);
      // サーバーが起動していない可能性
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSharedProjects = async () => {
    try {
      const currentToken = token ?? localStorage.getItem("sq_token");
      if (!currentToken) return;

      console.log('Fetching shared projects...');
      const response = await fetch(`${API_URL}/projects/shared`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Shared projects fetched:', data);
        setSharedProjects(data.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          accessedAt: new Date(p.accessedAt),
        })));
      } else {
        console.error('Failed to fetch shared projects:', response.status);
      }
    } catch (error) {
      console.error("Error fetching shared projects:", error);
    }
  };

  const markProjectAccessed = async (projectId: string) => {
    try {
      const currentToken = token ?? localStorage.getItem("sq_token");
      if (!currentToken) return;

      console.log('Marking project accessed:', projectId);
      // Optimistically assume success to avoid blocking
      await fetch(`${API_URL}/projects/${projectId}/access`, {
        method: 'POST',
        headers: getHeaders(),
      });
      console.log('Successfully marked project accessed');
    } catch (error) {
      console.error("Error marking project accessed:", error);
    }
  };

  // 初回読み込み
  useEffect(() => {
    // restore token first
    const t = localStorage.getItem("sq_token");
    if (t) {
      setToken(t);
      // only restore user if token exists
      const raw = localStorage.getItem("sq_user");
      if (raw) {
        try {
          const u = JSON.parse(raw) as User;
          setCurrentUser(u);
        } catch {
          // invalid stored user -> clear
          localStorage.removeItem("sq_user");
        }
      }
      // Pass the token directly to avoid race condition where state hasn't updated yet
      refreshProjects(t);
    } else {
      // ensure no stale user remains
      localStorage.removeItem("sq_user");
      // No token means guest mode - just set loading to false
      setLoading(false);
    }
  }, []);

  // 現在のプロジェクトを更新
  useEffect(() => {
    if (currentProject) {
      // sync updates from the list ONLY if it's one of the fetched projects (owned)
      // otherwise, currentProject updates are handled locally or via setCurrentProject directly from Editor
      const updated = projects.find((p) => p.id === currentProject.id);
      if (updated) {
        setCurrentProject(updated);
      }
    }
  }, [projects]);

  const createProject = async (
    name: string,
    description?: string,
    lessonName?: string,
    basicInfo?: string,
    initialStyle?: { backgroundColor: string; textColor: string; accentColor: string; fontFamily: string; },
    templateId?: string
  ) => {
    try {

      let initialSlides: Slide[] = [];
      let projectStyle = initialStyle;

      if (templateId) {
        const systemTemplate = SYSTEM_TEMPLATES.find(t => t.id === templateId);
        if (systemTemplate) {
          if (!projectStyle) {
            projectStyle = systemTemplate.style;
          }

          // Generate slides from template
          initialSlides = systemTemplate.slides.map((slideDef) => {
            const baseElements = generateLayoutElements(slideDef.template);

            // Apply custom elements if defined, otherwise just update content
            let elements = slideDef.customElements
              ? slideDef.customElements(baseElements)
              : baseElements;

            // Update title/content placeholders if they match standard roles
            elements = elements.map(el => {
              const newStyle = { ...el.style, fontFamily: projectStyle?.fontFamily || 'Inter, sans-serif' };
              const newEl = { ...el, style: newStyle };

              if (el.role === 'title' && slideDef.title) {
                return { ...newEl, content: slideDef.title };
              }
              if ((el.role === 'body' || el.role === 'subtitle') && slideDef.content) {
                return { ...newEl, content: slideDef.content };
              }
              return newEl;
            });

            return {
              id: crypto.randomUUID(),
              title: slideDef.title,
              content: slideDef.content,
              template: slideDef.template,
              backgroundColor: projectStyle?.backgroundColor || "#ffffff",
              textColor: projectStyle?.textColor || "#000000",
              elements: elements
            };
          });
        }
      }

      // Fallback if no template or empty
      if (initialSlides.length === 0) {
        initialSlides = [{
          id: crypto.randomUUID(),
          title: "ようこそ",
          content: "クリックしてスライドを編集",
          template: "title",
          backgroundColor: projectStyle?.backgroundColor || "#ffffff",
          textColor: projectStyle?.textColor || "#000000",
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'text',
              role: 'title',
              content: 'プレゼンテーションのタイトル',
              x: 80, y: 180, width: 800, height: 120,
              style: {
                fontSize: 64,
                fontWeight: 'bold',
                textAlign: 'center',
                alignItems: 'center',
                color: projectStyle?.textColor || '#1e293b',
                fontFamily: projectStyle?.fontFamily
              }
            },
            {
              id: crypto.randomUUID(),
              type: 'text',
              role: 'subtitle',
              content: 'サブタイトルまたは作成者',
              x: 180, y: 310, width: 600, height: 60,
              style: {
                fontSize: 28,
                textAlign: 'center',
                alignItems: 'center',
                color: projectStyle?.accentColor || '#64748b',
                fontFamily: projectStyle?.fontFamily
              }
            }
          ]
        }];
      }

      const newProject: Project = {
        id: crypto.randomUUID(),
        name,
        description,
        lessonName,
        basicInfo,
        slides: initialSlides,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newProject),
      });

      if (!response.ok) throw new Error("プロジェクトの作成に失敗しました");

      await refreshProjects(undefined, true);
    } catch (error) {
      console.error("プロジェクト作成エラー:", error);
      alert("プロジェクトの作成に失敗しました");
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error("プロジェクトの削除に失敗しました");

      if (currentProject?.id === id) {
        setCurrentProject(null);
      }

      await refreshProjects(undefined, true);
    } catch (error) {
      console.error("プロジェクト削除エラー:", error);
      alert("プロジェクトの削除に失敗しました");
    }
  };

  const updateProject = async (project: Project) => {
    try {
      const updatedProject = { ...project, updatedAt: new Date() };

      // always update local state immediately
      setCurrentProject(updatedProject);

      // Only sync to API if we own this project (it's in our projects list)
      // If we are a guest, Editor.tsx handles the Firebase sync, and we shouldn't hit the API
      const isOwned = projects.some(p => p.id === project.id);
      if (!isOwned) {
        return;
      }

      const response = await fetch(`${API_URL}/projects/${project.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) throw new Error("プロジェクトの更新に失敗しました");

      await refreshProjects(undefined, true);
    } catch (error) {
      console.error("プロジェクト更新エラー:", error);
      // alert("プロジェクトの更新に失敗しました");
    }
  };

  const addSlide = async (projectId: string, template: Slide["template"]) => {
    // try to find in list, otherwise fallback to currentProject (for guests)
    const project = projects.find((p) => p.id === projectId) || (currentProject?.id === projectId ? currentProject : null);
    if (!project) return;

    // Use shared utility to generate elements
    const elements = generateLayoutElements(template);

    const newSlide: Slide = {
      id: crypto.randomUUID(),
      title: "新しいスライド",
      content: "クリックして編集",
      template,
      backgroundColor: "#ffffff",
      textColor: "#000000",
      elements: elements,
    };

    const updatedProject = {
      ...project,
      slides: [...project.slides, newSlide],
      updatedAt: new Date(),
    };

    await updateProject(updatedProject);
  };

  const updateSlide = async (
    projectId: string,
    slideId: string,
    updates: Partial<Slide>
  ) => {
    const project = projects.find((p) => p.id === projectId) || (currentProject?.id === projectId ? currentProject : null);
    if (!project) return;

    const updatedProject = {
      ...project,
      slides: project.slides.map((s) =>
        s.id === slideId ? { ...s, ...updates } : s
      ),
      updatedAt: new Date(),
    };

    await updateProject(updatedProject);
  };

  const deleteSlide = async (projectId: string, slideId: string) => {
    const project = projects.find((p) => p.id === projectId) || (currentProject?.id === projectId ? currentProject : null);
    if (!project || project.slides.length <= 1) return;

    const updatedProject = {
      ...project,
      slides: project.slides.filter((s) => s.id !== slideId),
      updatedAt: new Date(),
    };

    await updateProject(updatedProject);
  };

  const duplicateSlide = async (projectId: string, slideId: string) => {
    const project = projects.find((p) => p.id === projectId) || (currentProject?.id === projectId ? currentProject : null);
    if (!project) return;

    const slideIndex = project.slides.findIndex((s) => s.id === slideId);
    if (slideIndex === -1) return;

    const originalSlide = project.slides[slideIndex];
    const newSlide: Slide = {
      ...originalSlide,
      id: crypto.randomUUID(),
      title: originalSlide.title,
    };

    const newSlides = [...project.slides];
    newSlides.splice(slideIndex + 1, 0, newSlide);

    const updatedProject = {
      ...project,
      slides: newSlides,
      updatedAt: new Date(),
    };

    await updateProject(updatedProject);
    setCurrentSlideIndex(slideIndex + 1);
  };

  /* ----------------
     Auth functions
     ---------------- */
  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      // expect { user, token }
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem("sq_user", JSON.stringify(data.user));
      localStorage.setItem("sq_token", data.token);

      // refresh projects immediately using the new token (pass overrideToken)
      await refreshProjects(data.token);

      return true;
    } catch (error) {
      console.error("ログイン失敗:", error);
      return false;
    }
  };

  const register = async (
    username: string,
    password: string,
    email?: string
  ) => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("登録失敗:", data);
        return false;
      }
      const data = await res.json();
      // expect { user, token }
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem("sq_user", JSON.stringify(data.user));
      localStorage.setItem("sq_token", data.token);

      // refresh projects immediately using the new token
      await refreshProjects(data.token);

      return true;
    } catch (error) {
      console.error("登録エラー:", error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    setProjects([]);
    setCurrentProject(null);
    setCurrentSlideIndex(0);
    localStorage.removeItem("sq_user");
    localStorage.removeItem("sq_token");
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        sharedProjects,
        currentProject,
        currentSlideIndex,
        loading,
        currentUser,
        createProject,
        deleteProject,
        setCurrentProject,
        updateProject,
        addSlide,
        updateSlide,
        deleteSlide,
        duplicateSlide,
        setCurrentSlideIndex,
        refreshProjects,
        fetchSharedProjects,
        markProjectAccessed,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
