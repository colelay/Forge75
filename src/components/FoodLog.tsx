import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Utensils, 
  ChefHat, 
  Zap, 
  Search,
  ArrowRight,
  Flame,
  Dna,
  Wheat,
  Trash2,
  Edit2,
  ChevronRight,
  ArrowLeft,
  Bookmark,
  Heart,
  RefreshCw,
  Camera,
  Sparkles,
  X
} from 'lucide-react';
import { User, FoodLog, Challenge, SavedRecipe } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { generateRecipes, scanNutrition } from '../services/geminiService';

interface FoodLogViewProps {
  user: User;
  challenge: Challenge;
}

export default function FoodLogView({ user, challenge }: FoodLogViewProps) {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecipePage, setShowRecipePage] = useState(false);
  const [showCreateRecipeModal, setShowCreateRecipeModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [recipeTab, setRecipeTab] = useState<'generate' | 'saved'>('generate');
  const [recipeCategory, setRecipeCategory] = useState('Low Carb');
  const [editingFood, setEditingFood] = useState<FoodLog | null>(null);
  const [swappingIngredient, setSwappingIngredient] = useState<{ recipeIdx: number, ingIdx: number } | null>(null);
  const [swapValue, setSwapValue] = useState('');
  const [newRecipe, setNewRecipe] = useState<Partial<SavedRecipe>>({
    name: '',
    ingredients: '[]',
    instructions: '',
    macros: JSON.stringify({ cal: 0, p: 0, c: 0, f: 0 })
  });
  const [newRecipeIngredients, setNewRecipeIngredients] = useState<string[]>(['']);
  const [newRecipeMacros, setNewRecipeMacros] = useState({ cal: 0, p: 0, c: 0, f: 0 });
  const [newFood, setNewFood] = useState<Partial<FoodLog>>({
    meal_type: 'breakfast',
    food_name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchLogs();
    fetchSavedRecipes();
  }, []);

  const fetchLogs = async () => {
    const res = await fetch(`/api/food/${user.id}/${today}`);
    const data = await res.json();
    setLogs(data);
  };

  const fetchSavedRecipes = async () => {
    const res = await fetch(`/api/recipes/saved/${user.id}`);
    const data = await res.json();
    setSavedRecipes(data);
  };

  const handleSaveRecipe = async (recipe: any) => {
    await fetch('/api/recipes/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        macros: recipe.macros
      })
    });
    fetchSavedRecipes();
    setShowCreateRecipeModal(false);
  };

  const handleCreateRecipe = async () => {
    await handleSaveRecipe({
      name: newRecipe.name,
      ingredients: newRecipeIngredients.filter(i => i.trim() !== ''),
      instructions: newRecipe.instructions,
      macros: newRecipeMacros
    });
    setNewRecipe({ name: '', ingredients: '[]', instructions: '', macros: JSON.stringify({ cal: 0, p: 0, c: 0, f: 0 }) });
    setNewRecipeIngredients(['']);
    setNewRecipeMacros({ cal: 0, p: 0, c: 0, f: 0 });
  };

  const handleLogRecipe = async (recipe: SavedRecipe, mealType?: string) => {
    try {
      const macros = typeof recipe.macros === 'string' ? JSON.parse(recipe.macros) : recipe.macros;
      await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          meal_type: mealType || 'lunch',
          food_name: recipe.name,
          calories: macros.cal,
          protein: macros.p,
          carbs: macros.c,
          fat: macros.f,
          date: today
        })
      });
      fetchLogs();
      setShowRecipePage(false);
    } catch (error) {
      console.error('Failed to log recipe:', error);
    }
  };

  const handleDeleteSavedRecipe = async (id: number) => {
    await fetch(`/api/recipes/saved/${id}`, { method: 'DELETE' });
    fetchSavedRecipes();
  };

  const generateAIRecipes = async (category: string) => {
    setLoadingRecipes(true);
    setRecipeCategory(category);
    try {
      const macros = {
        protein: challenge.macro_protein,
        carbs: challenge.macro_carbs,
        fat: challenge.macro_fat
      };
      const data = await generateRecipes(
        category, 
        macros, 
        user.has_diabetes, 
        user.profile?.dietary_restrictions
      );
      setRecipes(data);
    } catch (error) {
      console.error('Failed to generate recipes:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleAddFood = async () => {
    const method = editingFood ? 'PUT' : 'POST';
    const body = editingFood 
      ? { ...newFood, id: editingFood.id }
      : { ...newFood, userId: user.id, date: today };

    await fetch('/api/food', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    setShowAddModal(false);
    fetchLogs();
  };

  const handleDeleteFood = async (id: number) => {
    await fetch(`/api/food/${id}`, { method: 'DELETE' });
    fetchLogs();
  };

  const handleScanFood = async () => {
    if (!scanInput && !scanImage) return;
    setScanning(true);
    try {
      let input: any = scanInput;
      if (scanImage) {
        const base64Data = scanImage.split(',')[1];
        const mimeType = scanImage.split(';')[0].split(':')[1];
        input = { data: base64Data, mimeType };
      }
      
      const result = await scanNutrition(input);
      if (result) {
        setNewFood({
          ...newFood,
          food_name: result.foodName,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat
        });
        setShowScanModal(false);
        setShowAddModal(true);
      }
    } catch (error) {
      console.error('Failed to scan nutrition:', error);
    } finally {
      setScanning(false);
      setScanInput('');
      setScanImage(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScanImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const totals = logs.reduce((acc, log) => ({
    cal: acc.cal + log.calories,
    p: acc.p + log.protein,
    c: acc.c + log.carbs,
    f: acc.f + log.fat
  }), { cal: 0, p: 0, c: 0, f: 0 });

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      {showRecipePage ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between sticky top-0 bg-brand-bg/80 backdrop-blur-md z-20 py-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowRecipePage(false)}
                className="p-2 hover:bg-white/5 rounded-xl transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-display font-bold tracking-tight">Recipes</h1>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl">
              <button 
                onClick={() => setRecipeTab('generate')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  recipeTab === 'generate' ? "bg-brand-accent text-white" : "text-brand-muted"
                )}
              >
                Generate
              </button>
              <button 
                onClick={() => setRecipeTab('saved')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  recipeTab === 'saved' ? "bg-brand-accent text-white" : "text-brand-muted"
                )}
              >
                Saved ({savedRecipes.length})
              </button>
            </div>
          </div>

          {recipeTab === 'generate' ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {['Low Carb', 'Low Sugar', 'Weight Loss', 'Protein Heavy'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => generateAIRecipes(cat)}
                    className={cn(
                      "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                      recipeCategory === cat 
                        ? "bg-brand-accent border-brand-accent text-white" 
                        : "bg-white/5 border-white/10 text-brand-muted hover:border-white/20"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {recipes.map((recipe, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold leading-tight mb-1">{recipe.name}</h3>
                      <div className="flex gap-3">
                        <span className="text-xs text-brand-accent font-bold">{recipe.macros.cal} kcal</span>
                        <span className="text-xs text-brand-muted font-medium">P: {recipe.macros.p}g | C: {recipe.macros.c}g</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSaveRecipe(recipe)}
                      className="p-2 bg-white/5 hover:bg-brand-accent/20 rounded-lg text-brand-accent transition-all"
                    >
                      <Bookmark size={18} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-brand-muted mb-2 tracking-widest">Ingredients</h4>
                      <ul className="text-sm space-y-2">
                        {recipe.ingredients.map((ing: string, j: number) => (
                          <li key={j} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 flex-shrink-0" />
                            <span className="text-white/90">{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-brand-muted mb-2 tracking-widest">Instructions</h4>
                      <p className="text-xs text-brand-muted leading-relaxed">{recipe.instructions}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {loadingRecipes && (
                <div className="py-20 text-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <p className="text-sm text-brand-muted font-medium">Forging personalized recipes...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <button 
                onClick={() => setShowCreateRecipeModal(true)}
                className="w-full py-4 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/20 transition-all flex items-center justify-center gap-2 font-bold text-sm"
              >
                <Plus size={18} />
                Create Custom Recipe
              </button>
              <div className="grid grid-cols-1 gap-4">
                {savedRecipes.map((recipe) => {
                  const ingredients = JSON.parse(recipe.ingredients);
                  const macros = JSON.parse(recipe.macros);
                  return (
                    <motion.div key={recipe.id} className="glass-card p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold leading-tight mb-1">{recipe.name}</h3>
                          <div className="flex gap-3">
                            <span className="text-xs text-brand-accent font-bold">{macros.cal} kcal</span>
                            <span className="text-xs text-brand-muted font-medium">P: {macros.p}g | C: {macros.c}g</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleLogRecipe(recipe)}
                            className="p-2 bg-brand-accent/10 hover:bg-brand-accent/20 rounded-lg text-brand-accent transition-all"
                          >
                            <Plus size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSavedRecipe(recipe.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[10px] font-bold uppercase text-brand-muted mb-2 tracking-widest">Ingredients</h4>
                          <ul className="text-sm space-y-1">
                            {ingredients.map((ing: string, j: number) => (
                              <li key={j} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-brand-accent rounded-full flex-shrink-0" />
                                <span className="text-white/80">{ing}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-xs text-brand-muted leading-relaxed line-clamp-3">{recipe.instructions}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-display font-light tracking-tight">Fuel Log</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowScanModal(true)}
                className="bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent p-3 rounded-2xl transition-all flex items-center gap-2"
                title="AI Scan Food"
              >
                <Sparkles size={18} strokeWidth={1.5} />
                <span className="hidden sm:inline micro-label text-brand-accent">AI Scan</span>
              </button>
              <button 
                onClick={() => setShowRecipePage(true)}
                className="bg-white/5 hover:bg-white/10 text-brand-muted p-3 rounded-2xl transition-all flex items-center gap-2"
              >
                <ChefHat size={18} strokeWidth={1.5} />
                <span className="hidden sm:inline micro-label">Recipes</span>
              </button>
              <button 
                onClick={() => {
                  setEditingFood(null);
                  setNewFood({ meal_type: 'breakfast', food_name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
                  setShowAddModal(true);
                }}
                className="bg-brand-accent hover:bg-blue-600 text-white p-3 rounded-2xl accent-glow transition-all"
              >
                <Plus size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* My Recipes Preview */}
          {savedRecipes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold">My Recipes</h3>
                <button 
                  onClick={() => {
                    setRecipeTab('saved');
                    setShowRecipePage(true);
                  }}
                  className="text-xs font-bold text-brand-accent uppercase tracking-wider hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                {savedRecipes.slice(0, 5).map((recipe) => {
                  const macros = JSON.parse(recipe.macros);
                  return (
                    <motion.button
                      key={recipe.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLogRecipe(recipe)}
                      className="glass-card p-4 min-w-[200px] text-left group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Plus size={16} className="text-brand-accent" />
                      </div>
                      <h4 className="font-bold text-sm mb-1 truncate">{recipe.name}</h4>
                      <div className="flex gap-2">
                        <span className="text-[10px] text-brand-accent font-bold">{macros.cal} kcal</span>
                        <span className="text-[10px] text-brand-muted font-medium">P: {macros.p}g</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Macro Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Calories', value: totals.cal, target: challenge.macro_calories, icon: Flame, color: 'text-orange-400' },
              { label: 'Protein', value: totals.p, target: challenge.macro_protein, icon: Dna, color: 'text-blue-400' },
              { label: 'Carbs', value: totals.c, target: challenge.macro_carbs, icon: Wheat, color: 'text-emerald-400' },
              { label: 'Fat', value: totals.f, target: challenge.macro_fat, icon: Zap, color: 'text-yellow-400' },
            ].map((stat, i) => {
              const isOver = stat.value > stat.target;
              return (
                <div key={i} className={cn(
                  "glass-card p-4 md:p-5 flex flex-col items-center text-center transition-all",
                  isOver ? "border-red-500/30 bg-red-500/5" : ""
                )}>
                  <stat.icon className={cn("mb-2 md:mb-3", isOver ? "text-red-500" : stat.color)} size={16} strokeWidth={1.5} />
                  <p className={cn("text-xl md:text-2xl font-display font-light tracking-tight", isOver ? "text-red-500" : "text-white")}>
                    {stat.value}<span className="text-[10px] md:text-xs text-brand-muted font-normal"> / {stat.target}</span>
                  </p>
                  <p className="micro-label mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Meal Sections */}
          <div className="space-y-4">
            {['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => (
              <div key={meal} className="glass-card overflow-hidden">
                <div className="bg-white/[0.02] px-4 md:px-6 py-4 border-b border-white/5 flex justify-between items-center">
                  <h3 className="capitalize font-display font-light text-lg tracking-tight">{meal}</h3>
                  <span className="micro-label">
                    {logs.filter(l => l.meal_type === meal).reduce((sum, l) => sum + l.calories, 0)} kcal
                  </span>
                </div>
                <div className="p-2 md:p-4 space-y-1">
                  {logs.filter(l => l.meal_type === meal).map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-2xl hover:bg-white/[0.03] group transition-all">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-light text-sm md:text-base truncate text-white/90">{item.food_name}</p>
                        <p className="text-[10px] md:text-xs text-brand-muted tracking-wide mt-0.5">P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g</p>
                      </div>
                      <div className="flex items-center gap-3 md:gap-5">
                        <span className="font-mono text-sm md:text-base text-white/80">{item.calories}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => {
                              setEditingFood(item);
                              setNewFood(item);
                              setShowAddModal(true);
                            }}
                            className="p-1.5 hover:text-brand-accent transition-colors"
                          >
                            <Edit2 size={14} strokeWidth={1.5} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFood(item.id!)}
                            className="p-1.5 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-6 md:p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold">{editingFood ? 'Edit' : 'Add'} Food Entry</h2>
              <button onClick={() => setShowAddModal(false)} className="text-brand-muted"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-4">
                <label className="text-[10px] font-bold uppercase text-brand-accent tracking-widest mb-3 block">Quick Add from Saved Recipes</label>
                {savedRecipes.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {savedRecipes.map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          handleLogRecipe(r, newFood.meal_type);
                          setShowAddModal(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-bold whitespace-nowrap hover:bg-brand-accent/20 transition-all flex items-center gap-2"
                      >
                        <Plus size={14} />
                        {r.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-muted italic">No saved recipes yet. Save some to use Quick Add!</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Meal Type</label>
                <select 
                  value={newFood.meal_type}
                  onChange={e => setNewFood({...newFood, meal_type: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Food Name</label>
                <input 
                  value={newFood.food_name}
                  onChange={e => setNewFood({...newFood, food_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  placeholder="e.g. Grilled Chicken"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Calories</label>
                  <input 
                    type="number"
                    value={newFood.calories || ''}
                    onChange={e => setNewFood({...newFood, calories: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Protein (g)</label>
                  <input 
                    type="number"
                    value={newFood.protein || ''}
                    onChange={e => setNewFood({...newFood, protein: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Carbs (g)</label>
                  <input 
                    type="number"
                    value={newFood.carbs || ''}
                    onChange={e => setNewFood({...newFood, carbs: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Fat (g)</label>
                  <input 
                    type="number"
                    value={newFood.fat || ''}
                    onChange={e => setNewFood({...newFood, fat: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddFood}
                className="flex-1 py-3 rounded-xl bg-brand-accent hover:bg-blue-600 text-white font-bold accent-glow transition-all"
              >
                {editingFood ? 'Save' : 'Add Entry'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Recipe Modal */}
      {showCreateRecipeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold">Create Recipe</h2>
              <button onClick={() => setShowCreateRecipeModal(false)} className="text-brand-muted"><X size={24} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Recipe Name</label>
                <input 
                  value={newRecipe.name}
                  onChange={e => setNewRecipe({...newRecipe, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4"
                  placeholder="e.g. My Special Salad"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Ingredients</label>
                {newRecipeIngredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={ing}
                      onChange={e => {
                        const newIngs = [...newRecipeIngredients];
                        newIngs[idx] = e.target.value;
                        setNewRecipeIngredients(newIngs);
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm"
                      placeholder={`Ingredient ${idx + 1}`}
                    />
                    {newRecipeIngredients.length > 1 && (
                      <button 
                        onClick={() => setNewRecipeIngredients(newRecipeIngredients.filter((_, i) => i !== idx))}
                        className="text-red-400 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setNewRecipeIngredients([...newRecipeIngredients, ''])}
                  className="text-brand-accent text-xs font-bold uppercase mt-2"
                >
                  + Add Ingredient
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Instructions</label>
                <textarea 
                  value={newRecipe.instructions}
                  onChange={e => setNewRecipe({...newRecipe, instructions: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 h-24 resize-none"
                  placeholder="How to make it..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Calories</label>
                  <input 
                    type="number"
                    value={newRecipeMacros.cal || ''}
                    onChange={e => setNewRecipeMacros({...newRecipeMacros, cal: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Protein (g)</label>
                  <input 
                    type="number"
                    value={newRecipeMacros.p || ''}
                    onChange={e => setNewRecipeMacros({...newRecipeMacros, p: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Carbs (g)</label>
                  <input 
                    type="number"
                    value={newRecipeMacros.c || ''}
                    onChange={e => setNewRecipeMacros({...newRecipeMacros, c: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Fat (g)</label>
                  <input 
                    type="number"
                    value={newRecipeMacros.f || ''}
                    onChange={e => setNewRecipeMacros({...newRecipeMacros, f: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowCreateRecipeModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateRecipe}
                className="flex-1 py-3 rounded-xl bg-brand-accent hover:bg-blue-600 text-white font-bold accent-glow transition-all"
              >
                Save Recipe
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-6 md:p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="text-brand-accent" size={24} />
                <h2 className="text-2xl font-display font-bold">AI Nutrition Scan</h2>
              </div>
              <button onClick={() => setShowScanModal(false)} className="text-brand-muted"><X size={24} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase text-brand-muted tracking-widest">Describe your food</label>
                <textarea 
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 h-24 resize-none focus:border-brand-accent transition-all"
                  placeholder="e.g. 2 scrambled eggs with a slice of whole wheat toast..."
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-brand-bg px-2 text-brand-muted font-bold">Or Upload Photo</span>
                </div>
              </div>

              <div className="space-y-3">
                {scanImage ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-white/5 border border-white/10">
                    <img src={scanImage} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setScanImage(null)}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl hover:border-brand-accent/50 hover:bg-brand-accent/5 cursor-pointer transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="text-brand-muted mb-2" size={32} />
                      <p className="text-xs text-brand-muted font-bold uppercase">Tap to upload food photo</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              <button 
                onClick={handleScanFood}
                disabled={scanning || (!scanInput && !scanImage)}
                className={cn(
                  "w-full py-4 rounded-xl font-bold accent-glow transition-all flex items-center justify-center gap-2",
                  scanning || (!scanInput && !scanImage)
                    ? "bg-white/10 text-brand-muted cursor-not-allowed"
                    : "bg-brand-accent hover:bg-blue-600 text-white"
                )}
              >
                {scanning ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Analyze Nutrition
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
