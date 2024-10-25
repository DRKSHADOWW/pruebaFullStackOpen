import { useState, useEffect } from 'react'
import { Blog } from './components/Blog'
import blogService from './services/blogs'
import loginService from './services/login'
import { Notification } from './components/Notification'
import { BlogForm } from './components/BlogForm'
import { LoginForm } from './components/LoginForm'

const App = () => {

  const [blogs, setBlogs] = useState([])
  const [username, setUsername] = useState('') 
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null) 
  const [errorMessage,  setErrorMessage] = useState(null)

  useEffect(() => {
    blogService.getAll()
    .then(blogs =>
      setBlogs( blogs )
    )  
  }, [])

  useEffect(() => {
 
    const loggedUserJSON = window.localStorage.getItem('loggedBloggedAppUser');
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON);
        setUser(user)
        blogService.setToken(user.token);

    }
}, [])

  const handleLogin = async (event) => {
    event.preventDefault()
    
    try {
      const user = await loginService
      .login({
        username, password,
      })

      window.localStorage.setItem(
        "loggedBloggedAppUser",  JSON.stringify(user)
  
      )

      blogService.setToken(user.token)
      setUser(user)

      setErrorMessage('signed correctly')
      setTimeout(() => {
        setErrorMessage(null)
      }, 3000)

      setUsername('')
      setPassword('')

    } catch (e) {
      setErrorMessage(`Wrong credentials ${e.message}`)
      setTimeout(() => {
        setErrorMessage(null)
      }, 3000)
    }
  }

  const handleLogout = () => {
    try {
      if (user) { 
        setUser(null) 
        blogService.setToken(user.token)
        window.localStorage.removeItem('loggedBloggedAppUser')
        window.localStorage.clear('loggedBloggedAppUser')
      }
    } catch (error) {
      console.error(`Error at logout:`, error);
    }
  };

  const addBlogs = async (newBlog) =>{
  

    if (!newBlog.title || !newBlog.author || !newBlog.url) {
      setErrorMessage('Please complete all fields');
      return
    }
    
    try{
    const createBlogs = await blogService
    .create(newBlog)
      setBlogs(prevBlogs => [...prevBlogs, createBlogs])
      setErrorMessage(`blog added successfully!`)
      
      setTimeout(() => {
        setErrorMessage(null)
      }, 3000)

    }catch(e){
        setErrorMessage(`blog failed to add ${e.message}`)
        setTimeout(() => {
          setErrorMessage(null)
        }, 3000)
      }
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("¿Are you sure you want to delete this blog?");
    
    if (confirmDelete) {

      blogService.setToken(user.token);
      setUser(user)
   
      try {
        await blogService.blogDelete(id);
        setBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== id));
        setErrorMessage(`Blog deleted succesfully!`);
        setTimeout(() => {
          setErrorMessage(null)
        }, 3000)
      } catch (error) {
        setErrorMessage('Error at deleted the blog.', error);
        setTimeout(() => {
          setErrorMessage(null)
        }, 3000)
      }
    }
  }


  const updateLikes = async id => {
    const blogToUpdate = blogs.find(blog => blog.id === id);
    
    if (!blogToUpdate) {
      console.error(`Blog with id ${id} not found`);
      return
    }
  
    const updatedBlog = { ...blogToUpdate, likes: blogToUpdate.likes + 1 };
    
    try {
      await blogService
      .update(id, updatedBlog)
      setBlogs(prevBlogs => prevBlogs.map(blog => blog.id === id ? updatedBlog : blog));
    } catch (error) {
      console.error('Error updating likes:', error);
      setErrorMessage('Error updating likes. Please try again.');
      setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
    }
  }

  const toggleImportanceOf = async (id) => {
    const blog = blogs.find(n => n.id === id)
    const changedBlog = { ...blog, important: !blog.important }

    const returnedBlog = await blogService
    .update(id, changedBlog);
    setBlogs(blogs.map(blog => blog.id !== id ? blog : returnedBlog))
    
  }


  const sortedBlogs = blogs.sort((a, b) => b.likes - a.likes);

  return (
    <>
    <div>

      <Notification message={errorMessage}/>

      {user
      ?<BlogForm 
      onSubmit={addBlogs}
      handleLogout={handleLogout}

      />
      :<LoginForm 
      handleLogin={handleLogin}
      username={username}
      onChangeUsername={({ target }) => setUsername(target.value)}
      password={password}
      onChangePassword={({ target }) => setPassword(target.value)}/>
      }

   
      <h2>blogs</h2>
    
      {sortedBlogs.map(blog =>
        
        <Blog 
        key =  {blog.id}
        blog = {blog}
        onDelete = {() => handleDelete(blog.id)}
        onClick = {()=> updateLikes(blog.id)}
        onChange = {toggleImportanceOf}
    
        />
       
      )}
    </div>
    </>
  )
}

export default App