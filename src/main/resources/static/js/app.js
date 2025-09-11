const { createApp, ref, reactive, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;

const app = createApp({
    setup() {
        // 响应式数据
        const activeMenu = ref('home');
        const currentView = ref('home');
        const isLoggedIn = ref(false);
        const showRegister = ref(false);
        const showCreateBlog = ref(false);
        
        // 表单数据
        const loginForm = reactive({
            username: '',
            password: ''
        });
        
        const registerForm = reactive({
            username: '',
            email: '',
            password: '',
            nickname: ''
        });
        
        const blogForm = reactive({
            title: '',
            summary: '',
            content: '',
            categoryId: '',
            status: 1
        });
        
        // 博客数据
        const blogs = ref([
            {
                id: 1,
                title: 'Spring Boot 3.x 新特性详解',
                summary: 'Spring Boot 3.x 版本带来了很多令人兴奋的新特性，本文将详细介绍这些新特性的使用方法和最佳实践。',
                categoryName: '技术分享',
                status: 1,
                isTop: 1,
                viewCount: 156,
                likeCount: 23,
                createTime: '2024-09-10 10:30:00'
            },
            {
                id: 2,
                title: '个人博客系统设计思路',
                summary: '分享一下设计和开发个人博客系统的整体思路，包括技术选型、架构设计和功能规划。',
                categoryName: '项目实战',
                status: 1,
                isTop: 0,
                viewCount: 89,
                likeCount: 15,
                createTime: '2024-09-10 09:15:00'
            },
            {
                id: 3,
                title: 'Vue 3 + Element Plus 开发实践',
                summary: '记录在使用 Vue 3 和 Element Plus 开发前端界面过程中的一些心得体会和踩坑经验。',
                categoryName: '学习笔记',
                status: 0,
                isTop: 0,
                viewCount: 45,
                likeCount: 8,
                createTime: '2024-09-10 08:20:00'
            }
        ]);
        
        // 表单验证规则
        const loginRules = {
            username: [
                { required: true, message: '请输入用户名', trigger: 'blur' }
            ],
            password: [
                { required: true, message: '请输入密码', trigger: 'blur' }
            ]
        };
        
        const registerRules = {
            username: [
                { required: true, message: '请输入用户名', trigger: 'blur' },
                { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
            ],
            email: [
                { required: true, message: '请输入邮箱地址', trigger: 'blur' },
                { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
            ],
            password: [
                { required: true, message: '请输入密码', trigger: 'blur' },
                { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
            ]
        };
        
        // 方法
        const handleMenuSelect = (index) => {
            activeMenu.value = index;
            currentView.value = index;
            
            if (index === 'logout') {
                handleLogout();
            }
        };
        
        const testConnection = async () => {
            try {
                const response = await axios.get('/api/health');
                if (response.data.code === 200) {
                    ElMessage.success('后端服务连接正常！');
                } else {
                    ElMessage.error('后端服务连接失败！');
                }
            } catch (error) {
                console.error('连接测试失败:', error);
                ElMessage.error('后端服务连接失败，请检查服务是否启动！');
            }
        };
        
        const handleLogin = async () => {
            try {
                // 模拟登录请求
                console.log('登录信息:', loginForm);
                
                // 这里应该调用实际的登录API
                // const response = await axios.post('/api/user/login', loginForm);
                
                // 模拟登录成功
                setTimeout(() => {
                    isLoggedIn.value = true;
                    currentView.value = 'home';
                    activeMenu.value = 'home';
                    ElMessage.success('登录成功！');
                    
                    // 清空表单
                    loginForm.username = '';
                    loginForm.password = '';
                }, 1000);
                
            } catch (error) {
                console.error('登录失败:', error);
                ElMessage.error('登录失败，请检查用户名和密码！');
            }
        };
        
        const handleRegister = async () => {
            try {
                console.log('注册信息:', registerForm);
                
                // 这里应该调用实际的注册API
                // const response = await axios.post('/api/user/register', registerForm);
                
                // 模拟注册成功
                setTimeout(() => {
                    showRegister.value = false;
                    ElMessage.success('注册成功！请登录');
                    
                    // 清空表单
                    Object.keys(registerForm).forEach(key => {
                        registerForm[key] = '';
                    });
                }, 1000);
                
            } catch (error) {
                console.error('注册失败:', error);
                ElMessage.error('注册失败，请稍后再试！');
            }
        };
        
        const handleLogout = () => {
            ElMessageBox.confirm('确定要退出登录吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                isLoggedIn.value = false;
                currentView.value = 'home';
                activeMenu.value = 'home';
                ElMessage.success('已退出登录');
            }).catch(() => {
                // 用户取消退出
            });
        };
        
        const handleCreateBlog = async () => {
            try {
                console.log('创建博客:', blogForm);
                
                // 这里应该调用实际的创建博客API
                // const response = await axios.post('/api/blog', blogForm);
                
                // 模拟创建成功
                setTimeout(() => {
                    showCreateBlog.value = false;
                    ElMessage.success('博客创建成功！');
                    
                    // 添加到博客列表（模拟）
                    const newBlog = {
                        id: blogs.value.length + 1,
                        title: blogForm.title,
                        summary: blogForm.summary,
                        categoryName: '技术分享',
                        status: blogForm.status,
                        isTop: 0,
                        viewCount: 0,
                        likeCount: 0,
                        createTime: new Date().toLocaleString()
                    };
                    blogs.value.unshift(newBlog);
                    
                    // 清空表单
                    Object.keys(blogForm).forEach(key => {
                        if (key !== 'status') {
                            blogForm[key] = '';
                        }
                    });
                }, 1000);
                
            } catch (error) {
                console.error('创建博客失败:', error);
                ElMessage.error('创建博客失败，请稍后再试！');
            }
        };
        
        const editBlog = (blog) => {
            ElMessage.info('编辑功能开发中...');
        };
        
        const deleteBlog = (blog) => {
            ElMessageBox.confirm('确定要删除这篇博客吗？', '警告', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                const index = blogs.value.findIndex(b => b.id === blog.id);
                if (index > -1) {
                    blogs.value.splice(index, 1);
                    ElMessage.success('删除成功！');
                }
            }).catch(() => {
                // 用户取消删除
            });
        };
        
        const getAdminTitle = () => {
            const titles = {
                'admin-blogs': '博客管理',
                'admin-categories': '分类管理',
                'admin-tags': '标签管理'
            };
            return titles[currentView.value] || '管理中心';
        };
        
        // 组件挂载时执行
        onMounted(() => {
            console.log('MyBlog 系统已加载');
        });
        
        return {
            // 数据
            activeMenu,
            currentView,
            isLoggedIn,
            showRegister,
            showCreateBlog,
            loginForm,
            registerForm,
            blogForm,
            blogs,
            loginRules,
            registerRules,
            
            // 方法
            handleMenuSelect,
            testConnection,
            handleLogin,
            handleRegister,
            handleLogout,
            handleCreateBlog,
            editBlog,
            deleteBlog,
            getAdminTitle
        };
    }
});

// 使用 Element Plus
app.use(ElementPlus);

// 挂载应用
app.mount('#app');