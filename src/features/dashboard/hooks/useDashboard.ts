import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../auth/context/AuthContext';
import { projectsApi, type ProjectResponse } from '../../../api/projects';
import { mapServerErrorToEnglish } from '../../../api/errors';

export function useDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(9);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'PENDING_AI'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [localSearchResults, setLocalSearchResults] = useState<ProjectResponse[] | null>(null);
  const [localTotalElements, setLocalTotalElements] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
  const [shakeToggle, setShakeToggle] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    techStack: string[];
    aiEstimate: boolean;
  }>({
    name: '',
    description: '',
    techStack: [],
    aiEstimate: true
  });
  const [currentTechInput, setCurrentTechInput] = useState('');

  const closeModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 400);
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const fetchProjects = useCallback(async (page: number, size: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof projectsApi.listProjects>[0] = { page, size };

      if (status !== 'ALL') {
        params.status = status as any;
      }

      const response = await projectsApi.listProjects(params);
      setProjects(response.content || []);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      setError(parsed.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllForSearch = useCallback(async (status: string, query: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof projectsApi.listProjects>[0] = { page: 0, size: 100 };
      if (status !== 'ALL') {
        params.status = status as any;
      }
      const response = await projectsApi.listProjects(params);
      const all = response.content || [];

      const q = query.toLowerCase().trim();
      const filtered = all.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.techStack.some(t => t.toLowerCase().includes(q))
      );

      setLocalSearchResults(filtered);
      setLocalTotalElements(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
      setCurrentPage(0);
      setProjects(filtered.slice(0, pageSize));
      setTotalElements(filtered.length);
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      const parsed = mapServerErrorToEnglish(err, statusCode);
      setError(parsed.message);
      setProjects([]);
      setLocalSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setLocalSearchResults(null);
      fetchProjects(currentPage, pageSize, activeFilter);
    }
  }, [currentPage, pageSize, activeFilter, searchQuery, fetchProjects]);

  useEffect(() => {
    if (searchQuery.trim()) {
      fetchAllForSearch(activeFilter, searchQuery);
    }
  }, [searchQuery, activeFilter, fetchAllForSearch]);

  useEffect(() => {
    if (localSearchResults && searchQuery.trim()) {
      const start = currentPage * pageSize;
      setProjects(localSearchResults.slice(start, start + pageSize));
      setTotalElements(localTotalElements);
    }
  }, [currentPage, pageSize, localSearchResults, localTotalElements, searchQuery]);

  const handleFilterChange = useCallback((filter: typeof activeFilter) => {
    setActiveFilter(filter);
    setCurrentPage(0);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setCurrentPage(0);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [logout, navigate]);

  const addTag = useCallback((tagText: string) => {
    const clean = tagText.replace(/,/g, '').trim();
    if (clean) {
      setForm(prev => {
        if (prev.techStack.includes(clean)) return prev;
        return {
          ...prev,
          techStack: [...prev.techStack, clean]
        };
      });
    }
    setCurrentTechInput('');
  }, []);

  const removeTag = useCallback((indexToRemove: number) => {
    setForm(prev => ({
      ...prev,
      techStack: prev.techStack.filter((_, idx) => idx !== indexToRemove)
    }));
  }, []);

  const handleCreateProject = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors: { name?: string; description?: string } = {};
    if (!form.name.trim()) {
      errors.name = 'Project name is required.';
    }
    if (!form.description.trim()) {
      errors.description = 'Description is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShakeToggle(prev => !prev);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const finalTechStack = [...form.techStack];
      const trimmedInput = currentTechInput.trim();
      if (trimmedInput && !finalTechStack.includes(trimmedInput)) {
        finalTechStack.push(trimmedInput);
      }

      await projectsApi.createProject({
        name: form.name.trim(),
        description: form.description.trim(),
        techStack: finalTechStack,
        aiEstimate: form.aiEstimate
      });

      setForm({
        name: '',
        description: '',
        techStack: [],
        aiEstimate: true
      });
      setCurrentTechInput('');
      closeModal();
      fetchProjects(0, pageSize, activeFilter);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const isTimeout = axios.isAxiosError(err) && (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT');

      if (isTimeout) {
        setFormError('AI generation is taking longer than expected. The project may still be created — please check the dashboard in a moment.');
      } else {
        const parsed = mapServerErrorToEnglish(err, status);
        setFormError(parsed.message);
      }
      setShakeToggle(prev => !prev);
    } finally {
      setSubmitting(false);
    }
  }, [form, currentTechInput, closeModal, fetchProjects, pageSize, activeFilter]);

  const handleNameChange = useCallback((name: string) => {
    setForm(p => ({ ...p, name }));
    setFieldErrors(prev => ({ ...prev, name: undefined }));
    setFormError(null);
  }, []);

  const handleDescriptionChange = useCallback((desc: string) => {
    setForm(p => ({ ...p, description: desc }));
    setFieldErrors(prev => ({ ...prev, description: undefined }));
    setFormError(null);
  }, []);

  const stats = useMemo(() => {
    return {
      total: totalElements,
      active: projects.filter(p => p.status === 'ACTIVE' || p.status === 'PENDING_AI').length,
      completed: projects.filter(p => p.status === 'COMPLETED').length,
      hours: projects.reduce((sum, p) => sum + (p.totalLoggedHours || 0), 0)
    };
  }, [projects, totalElements]);

  return {
    user,
    projects,
    loading,
    error,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    activeFilter,
    searchInput,
    searchQuery,
    isModalOpen,
    isClosing,
    isProfileOpen,
    isMobileMenuOpen,
    submitting,
    formError,
    fieldErrors,
    shakeToggle,
    form,
    currentTechInput,
    stats,
    setIsProfileOpen,
    setIsMobileMenuOpen,
    setForm,
    setCurrentTechInput,
    setCurrentPage,
    closeModal,
    openModal,
    handleFilterChange,
    handleSearchChange,
    handlePageSizeChange,
    handleLogout,
    addTag,
    removeTag,
    handleCreateProject,
    fetchProjects,
    handleNameChange,
    handleDescriptionChange
  };
}
