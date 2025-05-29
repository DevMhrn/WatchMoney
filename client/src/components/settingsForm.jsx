import React, { Fragment, useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useStore } from "../store";
import { Combobox, Transition } from '@headlessui/react';
import { BsChevronExpand } from 'react-icons/bs';
import { BiCheck, BiLoader } from 'react-icons/bi';
import { fetchCountries } from '../libs';
import Input from "./ui/input";
import { Button } from "./ui/button";
import { toast } from 'sonner';
import api from '../libs/apiCalls';

export const SettingsForm = () => {
  const { user, theme, setTheme } = useStore((state) => state);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [countriesData, setCountriesData] = useState([]);
  const { setCredentials } = useStore((state) => state);
  const [selectedCountry, setSelectedCountry] = useState(null); // Start with null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstname: user?.firstname || "", // Handle potential undefined
      lastname: user?.lastname || "",
      email: user?.email || "",
      contact: user?.contact || "",
      currency: user?.currency || "", // Initialize currency
    },
  });

  const filteredCountries = React.useMemo(() => {
    if (!query) return countriesData;

    return countriesData.filter((country) =>
      country.country
        .toLowerCase()
        .includes(query.toLowerCase().trim())
    );
  }, [query, countriesData]);

  const initializeCountry = (countries) => {
    if (!countries.length) return;

    const userCountry = countries.find(c => c.cca2 === user?.country) ||
      countries.find(c => c.currency === user?.currency);

    if (userCountry) {
      setSelectedCountry(userCountry);
      setValue('currency', userCountry.currency);
    } else {
      // If user's country isn't found, default to the first country
      setSelectedCountry(countries[0]);
      setValue('currency', countries[0].currency);
    }
  };

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);
        const data = await fetchCountries();
        setCountriesData(data);
        initializeCountry(data);
      } catch (error) {
        console.error('Error loading countries:', error);
        toast.error('Failed to load countries');
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setValue('currency', country.currency);
    setQuery(''); // Clear search after selection
  };

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      const newData = {
        ...values,
        country: selectedCountry.cca2,
        currency: selectedCountry.currency,
      };

      const { data } = await api.put(`/users/${user?.id}`, newData);

      if (data?.status) {
        const newUser = { ...data.user, token: user.token };
        localStorage.setItem("user", JSON.stringify(newUser));
        setCredentials(newUser);
        toast.success(data?.message || 'Profile updated successfully');
      }
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      reset({
        firstname: user?.firstname || "",
        lastname: user?.lastname || "",
        email: user?.email || "",
        contact: user?.contact || "",
        currency: user?.currency || "",
      });
      initializeCountry(countriesData); // Reset country selection
      toast.success('Form reset to original values');
    } catch (error) {
      toast.error('Error resetting form');
    } finally {
      setIsResetting(false);
    }
  };

  const toggleTheme = (val) => {
    setTheme(val);
    localStorage.setItem("theme", val);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Fields */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className='w-full'>
          <Input
            id="firstname"
            name="firstname"
            label="First Name"
            placeholder="John"
            error={errors?.firstname?.message}
            {...register("firstname", {
              required: "First name is required"
            })}
            className="text-sm border dark:border-gray-800 dark:bg-transparent dark:text-gray-400 dark:outline-none dark:placeholder:text-gray-700"
          />
        </div>
        <div className='w-full'>
          <Input
            id="lastname"
            name="lastname"
            label="Last Name"
            placeholder="Doe"
            error={errors?.lastname?.message}
            {...register("lastname", {
              required: "Last name is required"
            })}
            className="text-sm border dark:border-gray-800 dark:bg-transparent dark:text-gray-400 dark:outline-none dark:placeholder:text-gray-700"
          />
        </div>
      </div>

      {/* Contact Fields */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className='w-full'>
          <Input
            id="email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="john@example.com"
            error={errors?.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
            className="text-sm border dark:border-gray-800 dark:bg-transparent dark:text-gray-400 dark:outline-none dark:placeholder:text-gray-700"
          />
        </div>
        <div className='w-full'>
          <Input
            id="contact"
            name="contact"
            type="tel"
            label="Contact Number"
            placeholder="+1234567890"
            error={errors?.contact?.message}
            {...register("contact", {
                required: "Contact number is required",
              pattern: {
                value: /^[+]?\d{10,14}$/,
                message: "Invalid phone number", 
               
              }
            })}
            className="text-sm border dark:border-gray-800 dark:bg-transparent dark:text-gray-400 dark:outline-none dark:placeholder:text-gray-700"
          />
        </div>
      </div>

      {/* Location and Currency */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className='w-full'>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
            Country
          </label>
          <Combobox value={selectedCountry} onChange={handleCountrySelect} disabled={loading}>
            <div className="relative mt-1">
              <div className="relative">
                <Combobox.Input
                  className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  displayValue={(country) => country?.country || ''}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country..."
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <BsChevronExpand className="text-gray-400" />
                </Combobox.Button>
              </div>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setQuery("")}
              >
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-gray-700">
                  {filteredCountries.length === 0 ? (
                    <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                      No countries found
                    </div>
                  ) : (
                    filteredCountries.map((country) => (
                      <Combobox.Option
                        key={country.cca2}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active
                            ? 'bg-blue-600/20 text-blue-900 dark:text-white'
                            : 'text-gray-900 dark:text-gray-300'
                          }`
                        }
                        value={country}
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center gap-2">
                              <img
                                src={country?.flag}
                                alt={country.country}
                                className="w-8 h-5 rounded-sm object-cover"
                              />
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {country?.country}
                                <span className="text-gray-500 text-sm ml-1">
                                  ({country?.currency})
                                </span>
                              </span>
                            </div>
                            {selected && (
                              <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'}`}>
                                <BiCheck className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
        <div className='w-full'>
          <Input
            disabled={loading}
            id="currency"
            name="currency"
            label="Currency"
            placeholder="USD"
            error={errors?.currency?.message}
            {...register("currency", {
                required: "Select the Country",
              maxLength: {
                value: 3,
                message: "Currency code must be 3 characters"
              },
              minLength: {
                value: 3,
                message: "Currency code must be 3 characters"
              }
            })}
            className="text-sm uppercase border dark:border-gray-800 dark:bg-transparent dark:text-gray-400 dark:outline-none dark:placeholder:text-gray-700"
          />
        </div>
      </div>

      {/* Theme Selector */}
      <div className="w-full flex items-center justify-between pt-10 border-t border-gray-200 dark:border-gray-800">
        <div>
          <p className="text-lg text-black dark:text-gray-400 font-semibold">
            Appearance
          </p>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Customize how your theme looks on your device.
          </span>
        </div>

        <div className="w-28 md:w-40">
          <select
            className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            defaultValue={theme}
            onChange={(e) => toggleTheme(e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      {/* Language Selector */}
      <div className="w-full flex items-center justify-between pb-10 border-b border-gray-200 dark:border-gray-800">
        <div>
          <p className="text-lg text-black dark:text-gray-400 font-semibold">
            Language
          </p>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Customize what language you want to use.
          </span>
        </div>

        <div className="w-28 md:w-40">
          <select className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" disabled>
            <option value="English">English</option>
          </select>
        </div>
      </div>

      {/* Submit and Reset Buttons */}
      <div className="flex items-center gap-6 justify-end pb-10 border-b-2 border-gray-200 dark:border-gray-800">
        <Button
          variant="outline"
          disabled={isResetting || isSubmitting}
          type="reset"
          onClick={handleReset}
          className="px-6 bg-transparent text-black dark:text-white border border-gray-200 dark:border-gray-700"
        >
          {isResetting ? <BiLoader className="w-4 h-4 animate-spin" /> : "Reset"}
        </Button>
        <Button
          disabled={isResetting || isSubmitting}
          type="submit"
          className="px-8 bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSubmitting ? <BiLoader className="w-4 h-4 animate-spin text-white" /> : "Save"}
        </Button>
      </div>
    </form>
  );
};

export default SettingsForm;